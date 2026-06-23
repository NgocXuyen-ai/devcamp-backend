import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Submission, SubmissionDocument } from './schemas/submission.schema';
import { PracticeEvaluationDto } from './dto/practice-evaluation.dto';
import { SubmissionStatus as DbSubmissionStatus } from '../common/enums';
import {
  runExecutableEvaluation,
  supportsExecutableRunner,
} from './executable-runner';
import type {
  EvaluationMode,
  JudgeRunResult,
  SubmissionStatusLabel,
} from './judge.types';

type JudgeTemplate = {
  id: string;
  title: string;
  input: string;
  expected: string;
  match: (source: string) => boolean;
  successText: string;
  failureText: string;
};

type SubmissionRecord = {
  id: number;
  status: SubmissionStatusLabel;
  date: string;
  language: string;
  runtime: string;
  memory: string;
  notes: string;
};

@Injectable()
export class ExercisesService {
  private readonly demoUserId = new Types.ObjectId('64b000000000000000000001');

  constructor(
    @InjectModel(Submission.name)
    private readonly submissionModel: Model<SubmissionDocument>,
  ) {}

  async run(dto: PracticeEvaluationDto): Promise<JudgeRunResult> {
    return this.evaluate(dto, 'sample');
  }

  async submit(dto: PracticeEvaluationDto) {
    const runResult = await this.evaluate(dto, 'full');
    const attemptNumber =
      (await this.submissionModel.countDocuments({
        practiceId: dto.practiceId,
        userId: this.demoUserId,
      })) + 1;

    const created = await this.submissionModel.create({
      userId: this.demoUserId,
      practiceId: dto.practiceId,
      title: dto.title,
      topic: dto.topic,
      track: dto.track,
      nodeId: this.toObjectId(dto.nodeId),
      language: dto.language,
      code: dto.code,
      status: this.toDbSubmissionStatus(runResult.status),
      score:
        runResult.total === 0
          ? 0
          : Math.round((runResult.passedCount / runResult.total) * 100),
      passedTestCount: runResult.passedCount,
      totalTestCount: runResult.total,
      testResults: runResult.cases.map((item, index) => ({
        index,
        passed: item.passed,
        actualOutput: item.detail,
        expectedOutput: item.expected,
        runtimeMs: this.parseRuntimeMs(runResult.runtime),
        memoryKb: this.parseMemoryKb(runResult.memory),
        errorMessage: item.passed ? undefined : item.detail,
      })),
      runtimeMs: this.parseRuntimeMs(runResult.runtime),
      memoryKb: this.parseMemoryKb(runResult.memory),
      notes: runResult.notes,
      compilerError:
        runResult.status === 'Accepted' || runResult.status === 'Wrong Answer'
          ? undefined
          : runResult.notes,
      attemptNumber,
      triggeredPenalty: false,
    });

    const submission = this.toSubmissionRecord(created);
    const submissions = await this.getSubmissions(dto.practiceId);

    return {
      runResult,
      submission,
      submissions,
    };
  }

  async getSubmissions(practiceId: string) {
    const items = await this.submissionModel
      .find({
        practiceId,
        userId: this.demoUserId,
      })
      .sort({ createdAt: -1, _id: -1 })
      .limit(20)
      .lean();

    return items.map((item) => this.toSubmissionRecord(item));
  }

  private async evaluate(
    dto: PracticeEvaluationDto,
    mode: EvaluationMode,
  ): Promise<JudgeRunResult> {
    if (supportsExecutableRunner(dto.language, dto.topic)) {
      const executableResult = await runExecutableEvaluation({
        language: dto.language as 'javascript' | 'python',
        code: dto.code,
        locale: dto.locale,
        mode,
      });

      if (executableResult) {
        return executableResult;
      }
    }

    return this.evaluateRuleBased(dto, mode);
  }

  private evaluateRuleBased(
    dto: PracticeEvaluationDto,
    mode: EvaluationMode,
  ): JudgeRunResult {
    const source = dto.code;
    const templates = [
      ...this.buildJudgeTemplates(dto),
      ...(mode === 'full' ? this.buildHiddenJudgeTemplates(dto) : []),
    ];
    const cases = templates.map((template) => {
      const passed = template.match(source);
      return {
        id: template.id,
        title: template.title,
        input: template.input,
        expected: template.expected,
        passed,
        detail: passed ? template.successText : template.failureText,
      };
    });

    const passedCount = cases.filter((item) => item.passed).length;
    const total = cases.length;
    const runtimeMs =
      18 +
      Math.min(45, Math.round(source.length / 120)) +
      Math.max(0, total - passedCount) * 9;
    const memoryMb =
      11.2 +
      Math.min(5.5, source.length / 850) +
      Math.max(0, total - passedCount) * 0.55;
    const failedCases = cases.filter((item) => !item.passed);
    const isVi = dto.locale === 'vi';

    return {
      status: passedCount === total ? 'Accepted' : 'Wrong Answer',
      passedCount,
      total,
      runtime: `${runtimeMs} ms`,
      memory: `${memoryMb.toFixed(1)} MB`,
      notes:
        failedCases.length === 0
          ? isVi
            ? `Pass ${passedCount}/${total} tiêu chí backend${mode === 'full' ? ' (full)' : ' (sample)'}.`
            : `Passed ${passedCount}/${total} backend ${mode === 'full' ? 'full' : 'sample'} checks.`
          : isVi
            ? `Pass ${passedCount}/${total} tiêu chí backend${mode === 'full' ? ' (full)' : ' (sample)'}. Cần sửa: ${failedCases
                .map((item) => item.title)
                .join(', ')}.`
            : `Passed ${passedCount}/${total} backend ${mode === 'full' ? 'full' : 'sample'} checks. Improve: ${failedCases
                .map((item) => item.title)
                .join(', ')}.`,
      cases,
    };
  }

  private buildJudgeTemplates(dto: PracticeEvaluationDto): JudgeTemplate[] {
    const isVi = dto.locale === 'vi';
    const title = dto.title.toLowerCase();
    const topic = dto.topic;
    const templates: JudgeTemplate[] = [];
    const addAll = (
      id: string,
      caseTitle: string,
      input: string,
      expected: string,
      patterns: RegExp[],
      successText: string,
      failureText: string,
    ) => {
      templates.push({
        id,
        title: caseTitle,
        input,
        expected,
        match: (source) => patterns.every((pattern) => pattern.test(source)),
        successText,
        failureText,
      });
    };
    const addAny = (
      id: string,
      caseTitle: string,
      input: string,
      expected: string,
      patterns: RegExp[],
      successText: string,
      failureText: string,
    ) => {
      templates.push({
        id,
        title: caseTitle,
        input,
        expected,
        match: (source) => patterns.some((pattern) => pattern.test(source)),
        successText,
        failureText,
      });
    };

    if (
      title.includes('basic html structure') ||
      topic === 'HTML & Semantics'
    ) {
      addAll(
        'html-shell',
        isVi ? 'Bộ khung HTML5' : 'HTML5 shell',
        isVi ? 'Tạo tài liệu HTML chuẩn' : 'Create a valid HTML document',
        '`<!doctype html>`, `<html>`, `<head>`, `<body>`',
        [/<!doctype html>/i, /<html\b/i, /<head\b/i, /<body\b/i],
        isVi ? 'Bộ khung HTML đã đủ.' : 'HTML shell looks valid.',
        isVi
          ? 'Thiếu `doctype`, `html`, `head` hoặc `body`.'
          : 'Missing `doctype`, `html`, `head`, or `body`.',
      );
      addAny(
        'html-meta',
        isVi ? 'Metadata cơ bản' : 'Basic metadata',
        isVi ? 'Thêm metadata trang' : 'Add page metadata',
        '`<title>` hoặc `meta viewport`',
        [/<title>[\s\S]*<\/title>/i, /meta[^>]+name=["']viewport["']/i],
        isVi ? 'Đã có metadata cơ bản.' : 'Page metadata is present.',
        isVi
          ? 'Nên thêm `title` hoặc `meta viewport`.'
          : 'Add a `title` or `meta viewport`.',
      );
      addAny(
        'html-semantic',
        isVi ? 'Semantic tags' : 'Semantic tags',
        isVi
          ? 'Dùng ít nhất một semantic tag'
          : 'Use at least one semantic tag',
        '`main`, `header`, `section`, `article`, `footer`, `nav`, hoặc `aside`',
        [
          /<main\b/i,
          /<header\b/i,
          /<section\b/i,
          /<article\b/i,
          /<footer\b/i,
          /<nav\b/i,
          /<aside\b/i,
        ],
        isVi ? 'Đã có semantic structure.' : 'Semantic structure is present.',
        isVi
          ? 'Nên thêm semantic tags thay vì chỉ dùng `div`.'
          : 'Add semantic tags instead of only generic wrappers.',
      );
    } else if (topic === 'CSS & Layout') {
      addAny(
        'css-layout',
        isVi ? 'Layout engine' : 'Layout engine',
        isVi ? 'Tạo layout chính' : 'Create the main layout',
        '`display: flex` hoặc `display: grid`',
        [/display\s*:\s*flex/i, /display\s*:\s*grid/i],
        isVi ? 'Đã có layout engine.' : 'A layout engine is present.',
        isVi
          ? 'Thiếu `display: flex` hoặc `display: grid`.'
          : 'Missing `display: flex` or `display: grid`.',
      );
      addAny(
        'css-spacing',
        isVi ? 'Spacing' : 'Spacing',
        isVi ? 'Giữ spacing ổn định' : 'Keep spacing consistent',
        '`gap`, `padding`, hoặc `margin`',
        [/\bgap\s*:/i, /\bpadding\s*:/i, /\bmargin\s*:/i],
        isVi ? 'Đã có spacing cơ bản.' : 'Spacing rules are present.',
        isVi
          ? 'Nên thêm `gap`, `padding` hoặc `margin`.'
          : 'Add `gap`, `padding`, or `margin`.',
      );
      addAny(
        'css-responsive',
        isVi ? 'Responsive / positioning' : 'Responsive / positioning',
        isVi
          ? 'Xử lý responsive hoặc positioning'
          : 'Handle responsive layout or positioning',
        '`@media`, `position: sticky`, `position: fixed`, hoặc `grid-template-columns`',
        [
          /@media/i,
          /position\s*:\s*sticky/i,
          /position\s*:\s*fixed/i,
          /grid-template-columns\s*:/i,
        ],
        isVi
          ? 'Đã có xử lý layout nâng cao.'
          : 'Advanced layout handling is present.',
        isVi
          ? 'Thiếu breakpoint hoặc positioning phù hợp.'
          : 'Missing a breakpoint or positioning rule.',
      );
    } else if (topic === 'Accessibility') {
      addAny(
        'a11y-label',
        isVi ? 'Accessible labels' : 'Accessible labels',
        isVi ? 'Gắn nhãn cho thành phần' : 'Label the control',
        '`label`, `aria-label`, hoặc `aria-labelledby`',
        [/<label\b/i, /aria-label=/i, /aria-labelledby=/i],
        isVi ? 'Đã có nhãn truy cập.' : 'Accessible labels are present.',
        isVi
          ? 'Thiếu `label` hoặc ARIA label.'
          : 'Missing `label` or ARIA labeling.',
      );
      addAny(
        'a11y-feedback',
        isVi ? 'Error / status semantics' : 'Error / status semantics',
        isVi ? 'Thông báo lỗi hoặc trạng thái' : 'Expose errors or status',
        '`aria-live`, `role="alert"`, `aria-invalid`, hoặc `aria-describedby`',
        [
          /aria-live=/i,
          /role=["']alert["']/i,
          /aria-invalid=/i,
          /aria-describedby=/i,
        ],
        isVi ? 'Đã có semantics phản hồi.' : 'Feedback semantics are present.',
        isVi
          ? 'Thiếu live region hoặc error semantics.'
          : 'Missing live region or error semantics.',
      );
      addAny(
        'a11y-keyboard',
        isVi ? 'Keyboard support' : 'Keyboard support',
        isVi ? 'Hỗ trợ thao tác bàn phím' : 'Support keyboard interaction',
        '`tabindex`, `keydown`, `Escape`, `role="dialog"`, hoặc `aria-modal`',
        [
          /\btabindex=/i,
          /\bkeydown\b/i,
          /\bEscape\b/i,
          /role=["']dialog["']/i,
          /aria-modal=/i,
        ],
        isVi ? 'Đã có keyboard handling.' : 'Keyboard handling is present.',
        isVi
          ? 'Thiếu keyboard handling hoặc dialog semantics.'
          : 'Missing keyboard handling or dialog semantics.',
      );
    } else if (
      topic === 'HTTP Fundamentals' ||
      topic === 'API Design' ||
      topic === 'Authentication' ||
      topic === 'Caching' ||
      topic === 'Security' ||
      topic === 'Node.js Runtime' ||
      topic === 'Observability' ||
      topic === 'Messaging & Queues' ||
      topic === 'Concurrency'
    ) {
      addAny(
        'server-branching',
        isVi ? 'Response / flow handling' : 'Response / flow handling',
        isVi
          ? 'Xử lý nhánh response hoặc flow chính'
          : 'Handle response branching or the main flow',
        '`if`, `switch`, `return`, `status`, hoặc `response` shape',
        [
          /\bif\s*\(/i,
          /\bswitch\s*\(/i,
          /\breturn\b/i,
          /\bstatus\b/i,
          /\bresponse\b/i,
        ],
        isVi ? 'Đã có flow xử lý chính.' : 'Core flow handling is present.',
        isVi
          ? 'Thiếu flow xử lý hoặc response shape rõ ràng.'
          : 'Missing clear flow handling or response shape.',
      );
      addAny(
        'server-domain-primitive',
        isVi ? 'Domain primitive' : 'Domain primitive',
        isVi
          ? 'Dùng primitive phù hợp với chủ đề'
          : 'Use topic-specific primitives',
        isVi
          ? 'Có primitive như token, headers, queue, cache, trace...'
          : 'Use primitives like token, headers, queue, cache, trace...',
        [
          /\btoken\b/i,
          /\bjwt\b/i,
          /\bheader/i,
          /\bcache\b/i,
          /\bqueue\b/i,
          /\bretry\b/i,
          /\btrace/i,
          /\btransaction\b/i,
          /\block\b/i,
          /\bstream\b/i,
          /\blogger\b/i,
          /\brate/i,
          /\bsanitize\b/i,
        ],
        isVi
          ? 'Đã có primitive theo domain.'
          : 'Domain primitives are present.',
        isVi
          ? 'Thiếu primitive quan trọng theo chủ đề bài.'
          : 'Missing important topic-specific primitives.',
      );
      addAny(
        'server-contract',
        isVi ? 'Contract clarity' : 'Contract clarity',
        isVi ? 'Giữ contract rõ ràng' : 'Keep the contract clear',
        '`data`, `error`, `headers`, `body`, `idempotency`, hoặc `traceId`',
        [
          /\bdata\b/i,
          /\berror\b/i,
          /\bheaders\b/i,
          /\bbody\b/i,
          /\bidempot/i,
          /\btraceId\b/i,
        ],
        isVi ? 'Contract đã rõ hơn.' : 'The contract is clearer.',
        isVi
          ? 'Thiếu field hoặc contract response rõ ràng.'
          : 'Missing clear response or processing contract fields.',
      );
    } else if (
      topic === 'React' ||
      topic === 'JavaScript Fundamentals' ||
      topic === 'TypeScript' ||
      topic === 'State Management' ||
      topic === 'Testing' ||
      topic === 'Performance' ||
      topic === 'Forms & Validation'
    ) {
      addAny(
        'client-core',
        isVi ? 'Core implementation' : 'Core implementation',
        isVi
          ? 'Có primitive chính cho lời giải'
          : 'Use the main implementation primitive',
        '`function`, `async`, `useState`, `useEffect`, `describe`, hoặc type/interface',
        [
          /\bfunction\b/i,
          /\basync\b/i,
          /\buseState\b/i,
          /\buseEffect\b/i,
          /\bdescribe\s*\(/i,
          /\binterface\b/i,
          /\btype\b/i,
        ],
        isVi ? 'Đã có primitive chính.' : 'Core primitives are present.',
        isVi
          ? 'Code vẫn còn quá trống.'
          : 'The implementation is still too empty.',
      );
      addAny(
        'client-structure',
        isVi ? 'Readable structure' : 'Readable structure',
        isVi
          ? 'Giữ cấu trúc lời giải dễ đọc'
          : 'Keep the implementation readable',
        '`return`, helper, comment, selector, validation, hoặc assertion',
        [
          /\breturn\b/i,
          /\/\//,
          /#/,
          /\bselector\b/i,
          /\bvalidate\b/i,
          /\bexpect\s*\(/i,
        ],
        isVi ? 'Cấu trúc lời giải ổn.' : 'The structure is readable.',
        isVi
          ? 'Nên chia rõ logic hoặc thêm helper/assertion.'
          : 'Break the logic into clearer blocks or add assertions/helpers.',
      );
      addAny(
        'client-topic-fit',
        isVi ? 'Topic fit' : 'Topic fit',
        isVi ? 'Bám đúng trọng tâm bài' : 'Address the topic directly',
        isVi
          ? 'Có dấu hiệu bám vào state, test, validation, performance...'
          : 'Use topic-specific cues such as state, test, validation, performance...',
        [
          /\buseReducer\b/i,
          /\bmap\s*\(/i,
          /\bfilter\s*\(/i,
          /\breduce\s*\(/i,
          /\bexpect\s*\(/i,
          /\buserEvent\b/i,
          /\buseMemo\b/i,
          /\blocalStorage\b/i,
          /\berrors\b/i,
          /\bvalidate\b/i,
          /\?\./,
        ],
        isVi ? 'Đã có tín hiệu bám topic.' : 'The code addresses the topic.',
        isVi
          ? 'Thiếu tín hiệu cho đúng trọng tâm của bài.'
          : 'Missing signals that the solution addresses the main topic.',
      );
    } else if (topic === 'Database' && dto.language === 'sql') {
      addAll(
        'sql-core',
        isVi ? 'SQL skeleton' : 'SQL skeleton',
        isVi ? 'Viết query cơ bản' : 'Write a basic query',
        '`SELECT ... FROM ...`',
        [/\bselect\b/i, /\bfrom\b/i],
        isVi ? 'Đã có bộ khung query.' : 'The query skeleton is present.',
        isVi ? 'Thiếu `SELECT` hoặc `FROM`.' : 'Missing `SELECT` or `FROM`.',
      );
      addAny(
        'sql-analysis',
        isVi ? 'Aggregation / join' : 'Aggregation / join',
        isVi ? 'Tổng hợp hoặc kết nối dữ liệu' : 'Aggregate or join data',
        '`JOIN`, `GROUP BY`, `SUM`, `COUNT`, hoặc `AVG`',
        [
          /\bjoin\b/i,
          /\bgroup\s+by\b/i,
          /\bsum\s*\(/i,
          /\bcount\s*\(/i,
          /\bavg\s*\(/i,
        ],
        isVi
          ? 'Đã có xử lý phân tích dữ liệu.'
          : 'Data analysis logic is present.',
        isVi
          ? 'Thiếu `JOIN`, `GROUP BY` hoặc hàm tổng hợp.'
          : 'Missing `JOIN`, `GROUP BY`, or aggregate functions.',
      );
      addAny(
        'sql-readability',
        isVi ? 'Readable aliases' : 'Readable aliases',
        isVi ? 'Đặt alias hoặc lọc rõ ràng' : 'Use readable aliases or filters',
        '`AS`, `WHERE`, hoặc `ORDER BY`',
        [/\bas\b/i, /\bwhere\b/i, /\border\s+by\b/i],
        isVi ? 'Query đủ rõ ràng.' : 'The query is reasonably clear.',
        isVi
          ? 'Nên thêm alias, filter hoặc sắp xếp.'
          : 'Add aliases, filters, or ordering.',
      );
    }

    if (templates.length === 0) {
      addAny(
        'generic-core',
        isVi ? 'Core solution shape' : 'Core solution shape',
        dto.title,
        isVi
          ? 'Có ít nhất một primitive thể hiện hướng giải'
          : 'Include at least one clear solution primitive',
        [
          /\bfunction\b/i,
          /\bclass\b/i,
          /\basync\b/i,
          /=>/,
          /<main\b/i,
          /display\s*:/i,
        ],
        isVi ? 'Đã có khung lời giải.' : 'A solution skeleton is present.',
        isVi ? 'Lời giải còn quá trống.' : 'The solution is still too empty.',
      );
      addAny(
        'generic-readability',
        isVi ? 'Readable structure' : 'Readable structure',
        isVi ? 'Giữ cấu trúc rõ ràng' : 'Keep the structure readable',
        isVi
          ? 'Có `return`, helper, hoặc comment'
          : 'Use `return`, helpers, or comments',
        [/\breturn\b/i, /\/\//, /#/, /\/\*/, /\bconst\b/i, /\blet\b/i],
        isVi ? 'Cấu trúc ổn.' : 'The structure is readable.',
        isVi
          ? 'Nên tách logic rõ hơn.'
          : 'Break the logic into clearer blocks.',
      );
      addAny(
        'generic-topic',
        isVi ? 'Problem focus' : 'Problem focus',
        isVi ? 'Bám nội dung bài' : 'Address the problem directly',
        isVi ? 'Có keyword gắn với task' : 'Use cues tied to the task',
        [new RegExp(dto.topic.split(/\s+/)[0] ?? '', 'i')],
        isVi ? 'Có dấu hiệu bám topic.' : 'The code appears topic-aware.',
        isVi
          ? 'Chưa thấy tín hiệu bám topic.'
          : 'Not enough topic-specific cues yet.',
      );
    }

    return templates.slice(0, 4);
  }

  private buildHiddenJudgeTemplates(
    dto: PracticeEvaluationDto,
  ): JudgeTemplate[] {
    const isVi = dto.locale === 'vi';
    const topic = dto.topic;
    const hiddenTemplates: JudgeTemplate[] = [];
    const pushAny = (
      id: string,
      title: string,
      input: string,
      expected: string,
      patterns: RegExp[],
      successText: string,
      failureText: string,
    ) => {
      hiddenTemplates.push({
        id,
        title,
        input,
        expected,
        match: (source) => patterns.some((pattern) => pattern.test(source)),
        successText,
        failureText,
      });
    };

    if (topic === 'HTML & Semantics') {
      pushAny(
        'hidden-html-lang',
        isVi
          ? 'Hidden: khai báo document language'
          : 'Hidden: declare document language',
        isVi
          ? 'Kiểm tra cấu hình document nâng cao'
          : 'Check advanced document configuration',
        '`<html lang="...">` hoặc `<meta charset>`',
        [/<html[^>]+lang=["'][^"']+["']/i, /<meta[^>]+charset=/i],
        isVi
          ? 'Đã có cấu hình document tốt hơn.'
          : 'Document configuration looks solid.',
        isVi
          ? 'Hidden check: nên thêm `lang` hoặc `meta charset`.'
          : 'Hidden check: add `lang` or `meta charset`.',
      );
    } else if (topic === 'CSS & Layout') {
      pushAny(
        'hidden-css-overflow',
        isVi ? 'Hidden: kiểm soát overflow' : 'Hidden: control overflow',
        isVi ? 'Kiểm tra độ bền layout' : 'Check layout resilience',
        '`minmax`, `overflow`, `max-width`, hoặc `width: 100%`',
        [
          /\bminmax\s*\(/i,
          /\boverflow\s*:/i,
          /\bmax-width\s*:/i,
          /\bwidth\s*:\s*100%/i,
        ],
        isVi
          ? 'Đã có tín hiệu layout bền hơn.'
          : 'Layout resilience signals are present.',
        isVi
          ? 'Hidden check: nên thêm kiểm soát overflow hoặc width.'
          : 'Hidden check: add overflow or width control.',
      );
    } else if (topic === 'Accessibility') {
      pushAny(
        'hidden-a11y-focus',
        isVi ? 'Hidden: focus semantics' : 'Hidden: focus semantics',
        isVi ? 'Kiểm tra focus handling' : 'Check focus handling',
        '`focus`, `tabindex`, `aria-modal`, hoặc `role="dialog"`',
        [/\bfocus\b/i, /\btabindex=/i, /aria-modal=/i, /role=["']dialog["']/i],
        isVi ? 'Đã có focus handling.' : 'Focus handling signals are present.',
        isVi
          ? 'Hidden check: thiếu focus handling rõ ràng.'
          : 'Hidden check: missing clear focus handling.',
      );
    } else if (
      topic === 'React' ||
      topic === 'JavaScript Fundamentals' ||
      topic === 'TypeScript' ||
      topic === 'State Management' ||
      topic === 'Testing' ||
      topic === 'Performance' ||
      topic === 'Forms & Validation'
    ) {
      pushAny(
        'hidden-client-guardrail',
        isVi ? 'Hidden: edge-case guardrail' : 'Hidden: edge-case guardrail',
        isVi ? 'Kiểm tra guardrail của lời giải' : 'Check edge-case guardrails',
        '`if`, `?.`, `??`, `try`, hoặc validation branch',
        [/\bif\s*\(/i, /\?\./, /\?\?/i, /\btry\b/i, /\bvalidate\b/i],
        isVi ? 'Đã có guardrail cơ bản.' : 'Basic guardrails are present.',
        isVi
          ? 'Hidden check: nên xử lý edge case rõ hơn.'
          : 'Hidden check: add clearer edge-case handling.',
      );
    } else if (topic === 'Database' && dto.language === 'sql') {
      pushAny(
        'hidden-sql-filtering',
        isVi ? 'Hidden: filter / ordering' : 'Hidden: filter / ordering',
        isVi ? 'Kiểm tra tính chặt chẽ của query' : 'Check query discipline',
        '`WHERE`, `HAVING`, `ORDER BY`, hoặc alias rõ ràng',
        [/\bwhere\b/i, /\bhaving\b/i, /\border\s+by\b/i, /\bas\b/i],
        isVi ? 'Query đủ kỷ luật hơn.' : 'The query looks more disciplined.',
        isVi
          ? 'Hidden check: nên thêm filter, ordering hoặc alias.'
          : 'Hidden check: add filtering, ordering, or aliases.',
      );
    }

    return hiddenTemplates.slice(0, 2);
  }

  private toDbSubmissionStatus(
    status: SubmissionStatusLabel,
  ): DbSubmissionStatus {
    switch (status) {
      case 'Accepted':
        return DbSubmissionStatus.ACCEPTED;
      case 'Compilation Error':
        return DbSubmissionStatus.COMPILATION_ERROR;
      case 'Runtime Error':
        return DbSubmissionStatus.RUNTIME_ERROR;
      case 'Time Limit Exceeded':
        return DbSubmissionStatus.TIME_LIMIT_EXCEEDED;
      case 'Wrong Answer':
      default:
        return DbSubmissionStatus.WRONG_ANSWER;
    }
  }

  private getLanguageLabel(language: string) {
    const labels: Record<string, string> = {
      javascript: 'JavaScript',
      typescript: 'TypeScript',
      python: 'Python',
      java: 'Java',
      cpp: 'C++',
      c: 'C',
      csharp: 'C#',
      ruby: 'Ruby',
      go: 'Go',
      rust: 'Rust',
      php: 'PHP',
      swift: 'Swift',
      kotlin: 'Kotlin',
      dart: 'Dart',
      scala: 'Scala',
      r: 'R',
      sql: 'SQL',
      html: 'HTML',
      css: 'CSS',
    };

    return labels[language] ?? language;
  }

  private toSubmissionRecord(
    item:
      | (Submission & { _id?: Types.ObjectId; createdAt?: Date })
      | {
          _id?: Types.ObjectId;
          createdAt?: Date;
          status: DbSubmissionStatus;
          language: string;
          runtimeMs?: number;
          memoryKb?: number;
          notes?: string;
          compilerError?: string;
        },
  ): SubmissionRecord {
    const statusLabel: Record<DbSubmissionStatus, SubmissionStatusLabel> = {
      [DbSubmissionStatus.PENDING]: 'Wrong Answer',
      [DbSubmissionStatus.ACCEPTED]: 'Accepted',
      [DbSubmissionStatus.WRONG_ANSWER]: 'Wrong Answer',
      [DbSubmissionStatus.COMPILATION_ERROR]: 'Compilation Error',
      [DbSubmissionStatus.RUNTIME_ERROR]: 'Runtime Error',
      [DbSubmissionStatus.TIME_LIMIT_EXCEEDED]: 'Time Limit Exceeded',
      [DbSubmissionStatus.MEMORY_LIMIT_EXCEEDED]: 'Runtime Error',
    };

    return {
      id: Number.parseInt(String(item._id ?? Date.now()).slice(-12), 16),
      status: statusLabel[item.status] ?? 'Wrong Answer',
      date: item.createdAt?.toISOString() ?? new Date().toISOString(),
      language: this.getLanguageLabel(item.language),
      runtime:
        typeof item.runtimeMs === 'number' ? `${item.runtimeMs} ms` : 'N/A',
      memory:
        typeof item.memoryKb === 'number'
          ? `${(item.memoryKb / 1024).toFixed(1)} MB`
          : 'N/A',
      notes: item.notes || item.compilerError || 'Persisted submission record.',
    };
  }

  private parseRuntimeMs(runtime: string) {
    const value = Number.parseInt(runtime, 10);
    return Number.isFinite(value) ? value : undefined;
  }

  private parseMemoryKb(memory: string) {
    const value = Number.parseFloat(memory);
    if (!Number.isFinite(value)) return undefined;
    return Math.round(value * 1024);
  }

  private toObjectId(value?: string) {
    if (!value || !Types.ObjectId.isValid(value)) return undefined;
    return new Types.ObjectId(value);
  }
}
