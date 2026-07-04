import { Injectable } from '@nestjs/common';
import { Types } from 'mongoose';
import { IQuestion, IQuestionService } from '../interfaces/question.interface';
import { CareerField } from '../../common/enums';

@Injectable()
export class MockQuestionsService implements IQuestionService {
  private readonly mockQuestions: IQuestion[] = [
    {
      _id: new Types.ObjectId('507f1f77bcf86cd799439021'),
      title: '[FE] JavaScript closure',
      content:
        'Explain what a closure is in JavaScript and mention one practical use case in UI code.',
      field: CareerField.FRONTEND,
      difficulty: 'easy',
      testCases: [],
      correctAnswer: 'closure',
    },
    {
      _id: new Types.ObjectId('507f1f77bcf86cd799439022'),
      title: '[FE] React useEffect dependencies',
      content:
        'When should a value be included in a React useEffect dependency array? Mention the idea of stale values or reactivity.',
      field: CareerField.FRONTEND,
      difficulty: 'medium',
      testCases: [],
      correctAnswer: 'dependency',
    },
    {
      _id: new Types.ObjectId('507f1f77bcf86cd799439023'),
      title: '[BE] Rate limiter design',
      content:
        'Explain the token bucket idea for rate limiting in a backend service and mention why it helps protect APIs.',
      field: CareerField.BACKEND,
      difficulty: 'hard',
      testCases: [],
      correctAnswer: 'token bucket',
    },
    {
      _id: new Types.ObjectId('507f1f77bcf86cd799439024'),
      title: '[BE] Node.js event loop',
      content:
        'Explain the Node.js event loop and why non-blocking I/O matters for backend throughput.',
      field: CareerField.BACKEND,
      difficulty: 'easy',
      testCases: [],
      correctAnswer: 'event loop',
    },
    {
      _id: new Types.ObjectId('507f1f77bcf86cd799439025'),
      title: '[FE] CSS specificity',
      content:
        'What is CSS specificity and why can it make component styling hard to maintain?',
      field: CareerField.FRONTEND,
      difficulty: 'easy',
      testCases: [],
      correctAnswer: 'specificity',
    },
    {
      _id: new Types.ObjectId('507f1f77bcf86cd799439026'),
      title: '[FE] Event delegation',
      content:
        'Explain event delegation in the browser and mention one performance benefit for dynamic lists.',
      field: CareerField.FRONTEND,
      difficulty: 'medium',
      testCases: [],
      correctAnswer: 'delegation',
    },
    {
      _id: new Types.ObjectId('507f1f77bcf86cd799439027'),
      title: '[FE] Rendering performance',
      content:
        'A React page re-renders too often. Describe two strategies to reduce unnecessary re-renders and mention memoization.',
      field: CareerField.FRONTEND,
      difficulty: 'hard',
      testCases: [],
      correctAnswer: 'memoization',
    },
    {
      _id: new Types.ObjectId('507f1f77bcf86cd799439028'),
      title: '[FE] Accessible forms',
      content:
        'Why should form inputs be associated with labels and clear validation messages in accessible UI?',
      field: CareerField.FRONTEND,
      difficulty: 'medium',
      testCases: [],
      correctAnswer: 'label',
    },
    {
      _id: new Types.ObjectId('507f1f77bcf86cd799439029'),
      title: '[BE] Database indexing',
      content:
        'Explain what a database index is and why it can speed up read-heavy queries.',
      field: CareerField.BACKEND,
      difficulty: 'medium',
      testCases: [],
      correctAnswer: 'index',
    },
    {
      _id: new Types.ObjectId('507f1f77bcf86cd79943902a'),
      title: '[BE] Idempotency',
      content:
        'What is idempotency in API design and why is it important for retry-safe payment or order endpoints?',
      field: CareerField.BACKEND,
      difficulty: 'medium',
      testCases: [],
      correctAnswer: 'idempotency',
    },
    {
      _id: new Types.ObjectId('507f1f77bcf86cd79943902b'),
      title: '[BE] Queue-driven architecture',
      content:
        'Why would you move slow operations to a message queue instead of keeping them inside the synchronous request path?',
      field: CareerField.BACKEND,
      difficulty: 'medium',
      testCases: [],
      correctAnswer: 'queue',
    },
    {
      _id: new Types.ObjectId('507f1f77bcf86cd79943902c'),
      title: '[BE] Cache invalidation',
      content:
        'A service uses Redis to cache product data. What is cache invalidation and why is stale data a risk?',
      field: CareerField.BACKEND,
      difficulty: 'hard',
      testCases: [],
      correctAnswer: 'stale',
    },
    {
      _id: new Types.ObjectId('507f1f77bcf86cd79943902d'),
      title: '[CORE] Big-O reasoning',
      content:
        'Explain what Big-O complexity means and mention why O(n log n) is usually preferred over O(n^2) for large input.',
      field: CareerField.FULLSTACK,
      difficulty: 'easy',
      testCases: [],
      correctAnswer: 'complexity',
    },
    {
      _id: new Types.ObjectId('507f1f77bcf86cd79943902e'),
      title: '[CORE] HTTP status design',
      content:
        'When should an API return 400 versus 401? Mention validation or authentication in your explanation.',
      field: CareerField.FULLSTACK,
      difficulty: 'medium',
      testCases: [],
      correctAnswer: 'authentication',
    },
    {
      _id: new Types.ObjectId('507f1f77bcf86cd79943902f'),
      title: '[CORE] Testing pyramid',
      content:
        'What is the testing pyramid and why should unit tests generally outnumber end-to-end tests?',
      field: CareerField.FULLSTACK,
      difficulty: 'medium',
      testCases: [],
      correctAnswer: 'unit',
    },
    {
      _id: new Types.ObjectId('507f1f77bcf86cd799439030'),
      title: '[CORE] Debugging strategy',
      content:
        'A production bug appears intermittently. Describe a debugging approach and mention logs or reproduction steps.',
      field: CareerField.FULLSTACK,
      difficulty: 'medium',
      testCases: [],
      correctAnswer: 'logs',
    },
    {
      _id: new Types.ObjectId('507f1f77bcf86cd799439031'),
      title: '[CORE] CAP trade-off',
      content:
        'In distributed systems, what trade-off does the CAP theorem highlight? Mention consistency or availability.',
      field: CareerField.FULLSTACK,
      difficulty: 'hard',
      testCases: [],
      correctAnswer: 'consistency',
    },
    {
      _id: new Types.ObjectId('507f1f77bcf86cd799439032'),
      title: '[CORE] Authentication vs authorization',
      content:
        'Explain the difference between authentication and authorization in one short example.',
      field: CareerField.FULLSTACK,
      difficulty: 'easy',
      testCases: [],
      correctAnswer: 'authorization',
    },
  ];
  async findRandomByCriteria(
    field: CareerField,
    difficulty: string,
    count: number,
  ): Promise<IQuestion[]> {
    const pool = this.mockQuestions.filter(
      (q) => q.field == field && q.difficulty == difficulty,
    );
    const shuffled = [...pool].sort(() => Math.random() - 0.5);

    if (shuffled.length >= count) {
      return Promise.resolve(shuffled.slice(0, count));
    }

    const fallback = this.mockQuestions
      .filter((q) => q.field === field && q.difficulty !== difficulty)
      .sort(() => Math.random() - 0.5);

    return Promise.resolve([...shuffled, ...fallback].slice(0, count));
  }

  async findById(questionId: string): Promise<IQuestion | null> {
    const question = this.mockQuestions.find(
      (q) => q._id.toString() === questionId,
    );
    return Promise.resolve(question ?? null);
  }
}
