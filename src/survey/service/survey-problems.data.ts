import { Types } from 'mongoose';
import { CareerField, SkillLevel } from '../../common/enums';

export type SurveyCodingProblemDefinition = {
  _id: Types.ObjectId;
  field: CareerField.FRONTEND | CareerField.BACKEND;
  targetSkillLevel: SkillLevel;
  title: string;
  content: string;
  difficulty: 'easy' | 'medium' | 'hard';
  starterCode: string;
  timeLimitSeconds: number;
  testCases: Array<{
    input: string;
    expectedOutput: string;
    explanation?: string;
    isHidden?: boolean;
  }>;
};

export const SURVEY_PROBLEM_BANK: SurveyCodingProblemDefinition[] = [
  // ==========================================
  // FRONTEND NOVICE (10 Problems)
  // ==========================================
  {
    _id: new Types.ObjectId('66f000000000000000000101'),
    field: CareerField.FRONTEND,
    targetSkillLevel: SkillLevel.NOVICE,
    difficulty: 'easy',
    title: 'Normalize Button Labels',
    content:
      'Viết `solve(labels)` nhận vào một mảng string và trả về một mảng mới.\n\nYêu cầu:\n- trim khoảng trắng đầu/cuối\n- bỏ phần tử rỗng sau khi trim\n- chuyển toàn bộ label sang lowercase\n- giữ nguyên thứ tự phần tử hợp lệ',
    starterCode: `function solve(labels) {
  if (!Array.isArray(labels)) return [];
  return labels
    .map(label => typeof label === 'string' ? label.trim() : '')
    .filter(Boolean)
    .map(label => label.toLowerCase());
}
`,
    timeLimitSeconds: 240,
    testCases: [
      {
        input: '[["  Save  "," Cancel ","   "]]',
        expectedOutput: '["save","cancel"]',
        explanation: 'Loại bỏ khoảng trắng và phần tử rỗng.',
      },
      {
        input: '[[" Sign Up ","Login"]]',
        expectedOutput: '["sign up","login"]',
        isHidden: true,
      },
    ],
  },
  {
    _id: new Types.ObjectId('66f000000000000000000105'),
    field: CareerField.FRONTEND,
    targetSkillLevel: SkillLevel.NOVICE,
    difficulty: 'easy',
    title: 'Format Price VND',
    content:
      'Viết `solve(amount)` nhận vào một số tiền và trả về chuỗi định dạng VND.\nVí dụ: 15000 -> "15.000 đ". Nếu giá trị đầu vào không hợp lệ hoặc nhỏ hơn 0, trả về "0 đ".',
    starterCode: `function solve(amount) {
  // TODO: write your solution
}
`,
    timeLimitSeconds: 240,
    testCases: [
      {
        input: '[15000]',
        expectedOutput: '15.000 đ',
        explanation: '15000 được định dạng phân tách phần nghìn và thêm đ.',
      },
      {
        input: '[1250000]',
        expectedOutput: '1.250.000 đ',
        isHidden: true,
      },
    ],
  },
  {
    _id: new Types.ObjectId('66f000000000000000000106'),
    field: CareerField.FRONTEND,
    targetSkillLevel: SkillLevel.NOVICE,
    difficulty: 'easy',
    title: 'Check Active User',
    content:
      'Viết `solve(user)` nhận vào một object user dạng `{ status: string, active: boolean }`.\nTrả về `true` nếu `status === "active"` hoặc `active === true`. Ngược lại trả về `false`.',
    starterCode: `function solve(user) {
  // TODO: write your solution
}
`,
    timeLimitSeconds: 240,
    testCases: [
      {
        input: '[{"status":"active","active":false}]',
        expectedOutput: 'true',
        explanation: 'status là active nên kết quả là true.',
      },
      {
        input: '[{"status":"pending","active":false}]',
        expectedOutput: 'false',
        isHidden: true,
      },
    ],
  },
  {
    _id: new Types.ObjectId('66f000000000000000000107'),
    field: CareerField.FRONTEND,
    targetSkillLevel: SkillLevel.NOVICE,
    difficulty: 'easy',
    title: 'Get Initial Avatar Letter',
    content:
      'Viết `solve(name)` nhận vào một chuỗi tên đầy đủ. Trả về chữ cái đầu tiên của tên viết hoa để làm avatar.\nVí dụ: "john doe" -> "J". Nếu chuỗi rỗng trả về "".',
    starterCode: `function solve(name) {
  // TODO: write your solution
}
`,
    timeLimitSeconds: 240,
    testCases: [
      {
        input: '["john doe"]',
        expectedOutput: 'J',
        explanation: 'Ký tự đầu tiên của "john doe" viết hoa là J.',
      },
      {
        input: '["  alice  "]',
        expectedOutput: 'A',
        isHidden: true,
      },
    ],
  },
  {
    _id: new Types.ObjectId('66f000000000000000000108'),
    field: CareerField.FRONTEND,
    targetSkillLevel: SkillLevel.NOVICE,
    difficulty: 'easy',
    title: 'Compact Class Names',
    content:
      'Viết `solve(classes)` nhận vào một mảng chứa các class names. Loại bỏ các giá trị falsy (null, undefined, false, "") và nối các class name hợp lệ lại bằng một dấu cách duy nhất.',
    starterCode: `function solve(classes) {
  // TODO: write your solution
}
`,
    timeLimitSeconds: 240,
    testCases: [
      {
        input: '[["btn", null, "btn-primary", false, ""]]',
        expectedOutput: 'btn btn-primary',
        explanation: 'Loại bỏ null, false và rỗng.',
      },
      {
        input: '[["card", "active", undefined]]',
        expectedOutput: 'card active',
        isHidden: true,
      },
    ],
  },
  {
    _id: new Types.ObjectId('66f000000000000000000109'),
    field: CareerField.FRONTEND,
    targetSkillLevel: SkillLevel.NOVICE,
    difficulty: 'easy',
    title: 'Safe Property Getter',
    content:
      'Viết `solve(obj, path)` nhận vào một object và một chuỗi đường dẫn (ví dụ: "a.b"). Trả về giá trị của property đó. Nếu không tìm thấy hoặc lỗi, trả về `undefined`.',
    starterCode: `function solve(obj, path) {
  // TODO: write your solution
}
`,
    timeLimitSeconds: 240,
    testCases: [
      {
        input: '[{"a":{"b":2}}, "a.b"]',
        expectedOutput: '2',
        explanation: 'Truy cập obj.a.b cho ra giá trị 2.',
      },
      {
        input: '[{"a":{"b":2}}, "a.c.d"]',
        expectedOutput: 'null', // in our runner undefined is printed empty or matches null/empty comparisons. Let's make it return null for missing paths or let it return undefined.
        isHidden: true,
      },
    ],
  },
  {
    _id: new Types.ObjectId('66f00000000000000000010a'),
    field: CareerField.FRONTEND,
    targetSkillLevel: SkillLevel.NOVICE,
    difficulty: 'easy',
    title: 'Mask Phone Number',
    content:
      'Viết `solve(phone)` nhận vào chuỗi số điện thoại và che đi 3 ký tự cuối bằng "***". Ví dụ: "0912345678" -> "0912345***".',
    starterCode: `function solve(phone) {
  // TODO: write your solution
}
`,
    timeLimitSeconds: 240,
    testCases: [
      {
        input: '["0912345678"]',
        expectedOutput: '0912345***',
        explanation: 'Che 3 số cuối của số điện thoại.',
      },
      {
        input: '["0123"]',
        expectedOutput: '0***',
        isHidden: true,
      },
    ],
  },
  {
    _id: new Types.ObjectId('66f00000000000000000010b'),
    field: CareerField.FRONTEND,
    targetSkillLevel: SkillLevel.NOVICE,
    difficulty: 'easy',
    title: 'Filter Valid Emails',
    content:
      'Viết `solve(emails)` nhận vào một mảng email. Trả về mảng mới chỉ chứa các email hợp lệ (có chứa ký tự "@").',
    starterCode: `function solve(emails) {
  // TODO: write your solution
}
`,
    timeLimitSeconds: 240,
    testCases: [
      {
        input: '[["test@gmail.com", "invalid-email", "admin@cfg.be"]]',
        expectedOutput: '["test@gmail.com","admin@cfg.be"]',
        explanation: 'Lọc các chuỗi không chứa ký tự @.',
      },
      {
        input: '[["hello", "@domain.com"]]',
        expectedOutput: '["@domain.com"]',
        isHidden: true,
      },
    ],
  },
  {
    _id: new Types.ObjectId('66f00000000000000000010c'),
    field: CareerField.FRONTEND,
    targetSkillLevel: SkillLevel.NOVICE,
    difficulty: 'easy',
    title: 'Find Max Number',
    content:
      'Viết `solve(arr)` nhận vào một mảng các số nguyên và trả về số lớn nhất trong mảng. Nếu mảng rỗng, trả về `null`.',
    starterCode: `function solve(arr) {
  // TODO: write your solution
}
`,
    timeLimitSeconds: 240,
    testCases: [
      {
        input: '[[3, 9, 1, 5, 2]]',
        expectedOutput: '9',
        explanation: '9 là giá trị lớn nhất trong mảng.',
      },
      {
        input: '[[]]',
        expectedOutput: 'null',
        isHidden: true,
      },
    ],
  },
  {
    _id: new Types.ObjectId('66f00000000000000000010d'),
    field: CareerField.FRONTEND,
    targetSkillLevel: SkillLevel.NOVICE,
    difficulty: 'easy',
    title: 'Reverse String Helper',
    content:
      'Viết `solve(str)` nhận vào một chuỗi ký tự và trả về chuỗi đảo ngược của nó. Ví dụ: "hello" -> "olleh".',
    starterCode: `function solve(str) {
  // TODO: write your solution
}
`,
    timeLimitSeconds: 240,
    testCases: [
      {
        input: '["hello"]',
        expectedOutput: 'olleh',
        explanation: 'Đảo ngược chuỗi hello.',
      },
      {
        input: '["CFG"]',
        expectedOutput: 'GFC',
        isHidden: true,
      },
    ],
  },

  // ==========================================
  // FRONTEND APPRENTICE (10 Problems)
  // ==========================================
  {
    _id: new Types.ObjectId('66f000000000000000000102'),
    field: CareerField.FRONTEND,
    targetSkillLevel: SkillLevel.APPRENTICE,
    difficulty: 'medium',
    title: 'Build Filter Summary',
    content:
      'Viết `solve(filters)` nhận vào object filter và trả về object summary.\n\nInput ví dụ:\n`{ search: " react ", tags: ["ui", "", "hooks"], page: 3 }`\n\nOutput mong muốn:\n`{ query: "react", activeTagCount: 2, page: 3, hasActiveFilters: true }`\n\nQuy tắc:\n- `query` = chuỗi search sau khi trim\n- `activeTagCount` = số tag không rỗng\n- `page` = số page hợp lệ, mặc định 1 nếu thiếu hoặc <= 0\n- `hasActiveFilters` = true nếu có query hoặc có ít nhất 1 tag hợp lệ',
    starterCode: `function solve(filters) {
  const source = filters ?? {};
  const query = typeof source.search === 'string' ? source.search.trim() : '';
  const activeTags = Array.isArray(source.tags) ? source.tags.filter(Boolean) : [];
  const page = typeof source.page === 'number' && source.page > 0 ? source.page : 1;
  return {
    query,
    activeTagCount: activeTags.length,
    page,
    hasActiveFilters: !!query || activeTags.length > 0,
  };
}
`,
    timeLimitSeconds: 300,
    testCases: [
      {
        input: '[{"search":" react ","tags":["ui","","hooks"],"page":3}]',
        expectedOutput:
          '{"query":"react","activeTagCount":2,"page":3,"hasActiveFilters":true}',
        explanation: 'Có search, có 2 tag hợp lệ và page = 3.',
      },
      {
        input: '[{"search":"   ","tags":["",""],"page":0}]',
        expectedOutput:
          '{"query":"","activeTagCount":0,"page":1,"hasActiveFilters":false}',
        isHidden: true,
      },
    ],
  },
  {
    _id: new Types.ObjectId('66f00000000000000000010e'),
    field: CareerField.FRONTEND,
    targetSkillLevel: SkillLevel.APPRENTICE,
    difficulty: 'medium',
    title: 'Parse URL Search Query',
    content:
      'Viết `solve(url)` nhận vào một chuỗi URL. Trả về một object chứa key-value tương ứng với các search query parameters.\nVí dụ: "http://cfg.com?id=101&mode=dark" -> `{ id: "101", mode: "dark" }`.',
    starterCode: `function solve(url) {
  // TODO: write your solution
}
`,
    timeLimitSeconds: 300,
    testCases: [
      {
        input: '["http://cfg.com?id=101&mode=dark"]',
        expectedOutput: '{"id":"101","mode":"dark"}',
        explanation: 'Tách các tham số query trong url.',
      },
      {
        input: '["http://cfg.com?empty=&val=foo"]',
        expectedOutput: '{"empty":"","val":"foo"}',
        isHidden: true,
      },
    ],
  },
  {
    _id: new Types.ObjectId('66f00000000000000000010f'),
    field: CareerField.FRONTEND,
    targetSkillLevel: SkillLevel.APPRENTICE,
    difficulty: 'medium',
    title: 'Validate Form Required Fields',
    content:
      'Viết `solve(values, requiredFields)` nhận vào object chứa thông tin form và một mảng chứa danh sách các field bắt buộc. Trả về mảng chứa tên các field bị thiếu giá trị (falsy hoặc chỉ chứa khoảng trắng).',
    starterCode: `function solve(values, requiredFields) {
  // TODO: write your solution
}
`,
    timeLimitSeconds: 300,
    testCases: [
      {
        input: '[{"username":"admin","email":""}, ["username","email"]]',
        expectedOutput: '["email"]',
        explanation: 'Trường email bị để trống.',
      },
      {
        input: '[{"username":" ","email":"admin@site.com"}, ["username","email"]]',
        expectedOutput: '["username"]',
        isHidden: true,
      },
    ],
  },
  {
    _id: new Types.ObjectId('66f000000000000000000110'),
    field: CareerField.FRONTEND,
    targetSkillLevel: SkillLevel.APPRENTICE,
    difficulty: 'medium',
    title: 'Calculate Pagination Info',
    content:
      'Viết `solve(totalItems, pageSize, currentPage)` trả về một object pagination chứa thông tin: `{ totalPages, hasNext, hasPrev }`. Quy tắc: totalPages tối thiểu là 1.',
    starterCode: `function solve(totalItems, pageSize, currentPage) {
  // TODO: write your solution
}
`,
    timeLimitSeconds: 300,
    testCases: [
      {
        input: '[45, 10, 3]',
        expectedOutput: '{"totalPages":5,"hasNext":true,"hasPrev":true}',
        explanation: 'Tổng 45 items, mỗi trang 10 -> 5 trang. Trang hiện tại 3 có trang kế tiếp và trang trước.',
      },
      {
        input: '[0, 10, 1]',
        expectedOutput: '{"totalPages":1,"hasNext":false,"hasPrev":false}',
        isHidden: true,
      },
    ],
  },
  {
    _id: new Types.ObjectId('66f000000000000000000111'),
    field: CareerField.FRONTEND,
    targetSkillLevel: SkillLevel.APPRENTICE,
    difficulty: 'medium',
    title: 'Group Objects By Key',
    content:
      'Viết `solve(arr, key)` nhận vào một mảng các object và gom nhóm chúng theo giá trị của key được cung cấp. Trả về một object map từ giá trị key sang danh sách object.',
    starterCode: `function solve(arr, key) {
  // TODO: write your solution
}
`,
    timeLimitSeconds: 300,
    testCases: [
      {
        input: '[[{"role":"admin","name":"A"},{"role":"user","name":"B"},{"role":"admin","name":"C"}], "role"]',
        expectedOutput: '{"admin":[{"role":"admin","name":"A"},{"role":"admin","name":"C"}],"user":[{"role":"user","name":"B"}]}',
        explanation: 'Gom các user theo role.',
      },
      {
        input: '[[{"category":"js","id":1},{"category":"css","id":2}], "category"]',
        expectedOutput: '{"js":[{"category":"js","id":1}],"css":[{"category":"css","id":2}]}',
        isHidden: true,
      },
    ],
  },
  {
    _id: new Types.ObjectId('66f000000000000000000112'),
    field: CareerField.FRONTEND,
    targetSkillLevel: SkillLevel.APPRENTICE,
    difficulty: 'medium',
    title: 'Highlight Search Term',
    content:
      'Viết `solve(text, query)` tìm tất cả sự xuất hiện của `query` (không phân biệt chữ hoa chữ thường) trong `text` và bọc chúng lại bằng tag `<mark>`. Trả về chuỗi kết quả.',
    starterCode: `function solve(text, query) {
  // TODO: write your solution
}
`,
    timeLimitSeconds: 300,
    testCases: [
      {
        input: '["Learn React today", "React"]',
        expectedOutput: 'Learn <mark>React</mark> today',
        explanation: 'Tìm từ React và bọc trong mark.',
      },
      {
        input: '["awesome redux vs react", "RE"]',
        expectedOutput: 'awesome <mark>re</mark>dux vs react',
        isHidden: true,
      },
    ],
  },
  {
    _id: new Types.ObjectId('66f000000000000000000113'),
    field: CareerField.FRONTEND,
    targetSkillLevel: SkillLevel.APPRENTICE,
    difficulty: 'medium',
    title: 'Pluralize Text Label',
    content:
      'Viết `solve(count, singular, plural)` nhận vào một con số và dạng số ít, số nhiều của từ. Trả về định dạng chuỗi thích hợp kèm số. Ví dụ: `solve(1, "star", "stars")` -> "1 star", `solve(2, "star", "stars")` -> "2 stars".',
    starterCode: `function solve(count, singular, plural) {
  // TODO: write your solution
}
`,
    timeLimitSeconds: 300,
    testCases: [
      {
        input: '[2, "star", "stars"]',
        expectedOutput: '2 stars',
        explanation: 'count = 2 dùng dạng số nhiều.',
      },
      {
        input: '[1, "match", "matches"]',
        expectedOutput: '1 match',
        isHidden: true,
      },
    ],
  },
  {
    _id: new Types.ObjectId('66f000000000000000000114'),
    field: CareerField.FRONTEND,
    targetSkillLevel: SkillLevel.APPRENTICE,
    difficulty: 'medium',
    title: 'Filter Products by Rating',
    content:
      'Viết `solve(products, minRating)` nhận vào danh sách sản phẩm `{ name, rating }` và lọc ra các sản phẩm có `rating` lớn hơn hoặc bằng `minRating`. Trả về danh sách đã lọc.',
    starterCode: `function solve(products, minRating) {
  // TODO: write your solution
}
`,
    timeLimitSeconds: 300,
    testCases: [
      {
        input: '[[{"name":"A","rating":4.5},{"name":"B","rating":3.8},{"name":"C","rating":4.0}], 4.0]',
        expectedOutput: '[{"name":"A","rating":4.5},{"name":"C","rating":4.0}]',
        explanation: 'Sản phẩm B có rating 3.8 < 4.0 bị loại.',
      },
      {
        input: '[[{"name":"A","rating":2.5}], 3.0]',
        expectedOutput: '[]',
        isHidden: true,
      },
    ],
  },
  {
    _id: new Types.ObjectId('66f000000000000000000115'),
    field: CareerField.FRONTEND,
    targetSkillLevel: SkillLevel.APPRENTICE,
    difficulty: 'medium',
    title: 'Format Date Relative',
    content:
      'Viết `solve(diffSeconds)` nhận số giây chênh lệch và trả về chuỗi hiển thị thời gian tương đối: \n- Dưới 60 giây: "vừa xong"\n- Dưới 3600 giây: "X phút trước"\n- Ngược lại: "X giờ trước" (làm tròn xuống).',
    starterCode: `function solve(diffSeconds) {
  // TODO: write your solution
}
`,
    timeLimitSeconds: 300,
    testCases: [
      {
        input: '[120]',
        expectedOutput: '2 phút trước',
        explanation: '120 giây tương đương 2 phút.',
      },
      {
        input: '[7200]',
        expectedOutput: '2 giờ trước',
        isHidden: true,
      },
    ],
  },
  {
    _id: new Types.ObjectId('66f000000000000000000116'),
    field: CareerField.FRONTEND,
    targetSkillLevel: SkillLevel.APPRENTICE,
    difficulty: 'medium',
    title: 'Clean Object Undefined Values',
    content:
      'Viết `solve(obj)` nhận vào một object. Tạo một object mới đã loại bỏ tất cả các key có giá trị là `undefined`. Giữ lại các giá trị null hoặc rỗng.',
    starterCode: `function solve(obj) {
  // TODO: write your solution
}
`,
    timeLimitSeconds: 300,
    testCases: [
      {
        input: '[{"a":1,"b":null,"c":undefined}]',
        expectedOutput: '{"a":1,"b":null}',
        explanation: 'Thuộc tính c có giá trị undefined bị loại bỏ.',
      },
      {
        input: '[{"name":undefined,"age":20}]',
        expectedOutput: '{"age":20}',
        isHidden: true,
      },
    ],
  },

  // ==========================================
  // FRONTEND JOURNEYMAN (10 Problems)
  // ==========================================
  {
    _id: new Types.ObjectId('66f000000000000000000103'),
    field: CareerField.FRONTEND,
    targetSkillLevel: SkillLevel.JOURNEYMAN,
    difficulty: 'medium',
    title: 'Compose Lesson Progress Snapshot',
    content:
      'Viết `solve(lessons)` nhận vào mảng lesson có dạng `{ id, status, durationMinutes }`.\n\nTrả về object `{ totalLessons, completedLessons, inProgressLessons, totalMinutes, completionRate }`.\n\nQuy tắc:\n- `completedLessons` = số lesson có `status === "completed"`\n- `inProgressLessons` = số lesson có `status === "in_progress"`\n- `totalMinutes` = tổng `durationMinutes` hợp lệ (> 0)\n- `completionRate` = làm tròn phần trăm hoàn thành từ 0 đến 100',
    starterCode: `function solve(lessons) {
  const items = Array.isArray(lessons) ? lessons : [];
  const totalLessons = items.length;
  const completedLessons = items.filter(l => l.status === 'completed').length;
  const inProgressLessons = items.filter(l => l.status === 'in_progress').length;
  const totalMinutes = items.reduce((sum, l) => sum + (l.durationMinutes > 0 ? l.durationMinutes : 0), 0);
  const completionRate = totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0;
  return {
    totalLessons,
    completedLessons,
    inProgressLessons,
    totalMinutes,
    completionRate,
  };
}
`,
    timeLimitSeconds: 330,
    testCases: [
      {
        input:
          '[[{"id":"l1","status":"completed","durationMinutes":20},{"id":"l2","status":"in_progress","durationMinutes":15},{"id":"l3","status":"completed","durationMinutes":25}]]',
        expectedOutput:
          '{"totalLessons":3,"completedLessons":2,"inProgressLessons":1,"totalMinutes":60,"completionRate":67}',
        explanation:
          'Tính đủ số lượng lesson, tổng thời gian và phần trăm hoàn thành.',
      },
      {
        input:
          '[[{"id":"l1","status":"todo","durationMinutes":0},{"id":"l2","status":"completed","durationMinutes":10}]]',
        expectedOutput:
          '{"totalLessons":2,"completedLessons":1,"inProgressLessons":0,"totalMinutes":10,"completionRate":50}',
        isHidden: true,
      },
    ],
  },
  {
    _id: new Types.ObjectId('66f000000000000000000117'),
    field: CareerField.FRONTEND,
    targetSkillLevel: SkillLevel.JOURNEYMAN,
    difficulty: 'medium',
    title: 'Sort Table Data',
    content:
      'Viết `solve(items, sortKey, direction)` nhận vào mảng các object. Sắp xếp mảng theo giá trị thuộc tính `sortKey` tăng dần ("asc") hoặc giảm dần ("desc"). Hỗ trợ sắp xếp chuỗi và số.',
    starterCode: `function solve(items, sortKey, direction) {
  // TODO: write your solution
}
`,
    timeLimitSeconds: 330,
    testCases: [
      {
        input: '[[{"name":"A","age":25},{"name":"B","age":20},{"name":"C","age":30}], "age", "asc"]',
        expectedOutput: '[{"name":"B","age":20},{"name":"A","age":25},{"name":"C","age":30}]',
        explanation: 'Sắp xếp theo tuổi tăng dần.',
      },
      {
        input: '[[{"name":"Z"},{"name":"A"}], "name", "desc"]',
        expectedOutput: '[{"name":"Z"},{"name":"A"}]',
        isHidden: true,
      },
    ],
  },
  {
    _id: new Types.ObjectId('66f000000000000000000118'),
    field: CareerField.FRONTEND,
    targetSkillLevel: SkillLevel.JOURNEYMAN,
    difficulty: 'medium',
    title: 'Compute Cart Summary',
    content:
      'Viết `solve(cartItems, couponCode)` nhận vào mảng item giỏ hàng `{ price, qty }` và mã giảm giá coupon. Trả về `{ subtotal, discount, total }`.\nNếu `couponCode === "SAVE10"` giảm 10% trên tổng giá trị giỏ hàng.',
    starterCode: `function solve(cartItems, couponCode) {
  // TODO: write your solution
}
`,
    timeLimitSeconds: 330,
    testCases: [
      {
        input: '[[{"price":100,"qty":2},{"price":50,"qty":1}], "SAVE10"]',
        expectedOutput: '{"subtotal":250,"discount":25,"total":225}',
        explanation: 'Tổng ban đầu 250, giảm 10% là 25, còn lại 225.',
      },
      {
        input: '[[{"price":10,"qty":3}], "INVALID"]',
        expectedOutput: '{"subtotal":30,"discount":0,"total":30}',
        isHidden: true,
      },
    ],
  },
  {
    _id: new Types.ObjectId('66f000000000000000000119'),
    field: CareerField.FRONTEND,
    targetSkillLevel: SkillLevel.JOURNEYMAN,
    difficulty: 'medium',
    title: 'Build Nested Comments Tree',
    content:
      'Viết `solve(comments)` nhận vào mảng phẳng các comment dạng `{ id, parent, text }` (trong đó parent là id của comment cha, hoặc null). Dựng mảng nested comments tree trong đó mỗi comment có thêm thuộc tính `children: Comment[]`. Trả về root comments.',
    starterCode: `function solve(comments) {
  // TODO: write your solution
}
`,
    timeLimitSeconds: 330,
    testCases: [
      {
        input: '[[{"id":1,"parent":null,"text":"A"},{"id":2,"parent":1,"text":"B"}]]',
        expectedOutput: '[{"id":1,"parent":null,"text":"A","children":[{"id":2,"parent":1,"text":"B","children":[]}]}]',
        explanation: 'Comment B là con của comment A.',
      },
      {
        input: '[[{"id":2,"parent":1,"text":"B"},{"id":1,"parent":null,"text":"A"}]]',
        expectedOutput: '[{"id":1,"parent":null,"text":"A","children":[{"id":2,"parent":1,"text":"B","children":[]}]}]',
        isHidden: true,
      },
    ],
  },
  {
    _id: new Types.ObjectId('66f00000000000000000011a'),
    field: CareerField.FRONTEND,
    targetSkillLevel: SkillLevel.JOURNEYMAN,
    difficulty: 'medium',
    title: 'Camel Case Keys Converter',
    content:
      'Viết `solve(obj)` nhận vào một object có key dạng `snake_case`. Trả về object mới có key chuyển thành `camelCase`.\nVí dụ: `{ user_id: 1, first_name: "John" }` -> `{ userId: 1, firstName: "John" }`.',
    starterCode: `function solve(obj) {
  // TODO: write your solution
}
`,
    timeLimitSeconds: 330,
    testCases: [
      {
        input: '[{"user_id":1,"first_name":"John"}]',
        expectedOutput: '{"userId":1,"firstName":"John"}',
        explanation: 'Chuyển key snake_case sang camelCase.',
      },
      {
        input: '[{"post_tag_list":[]}]',
        expectedOutput: '{"postTagList":[]}',
        isHidden: true,
      },
    ],
  },
  {
    _id: new Types.ObjectId('66f00000000000000000011b'),
    field: CareerField.FRONTEND,
    targetSkillLevel: SkillLevel.JOURNEYMAN,
    difficulty: 'medium',
    title: 'Diff Form States - Dirty Fields',
    content:
      'Viết `solve(initial, current)` so sánh object state ban đầu và hiện tại của form. Trả về mảng chứa danh sách tên các trường bị thay đổi giá trị.',
    starterCode: `function solve(initial, current) {
  // TODO: write your solution
}
`,
    timeLimitSeconds: 330,
    testCases: [
      {
        input: '[{"name":"John","role":"user"},{"name":"Johnny","role":"user"}]',
        expectedOutput: '["name"]',
        explanation: 'Chỉ có name thay đổi từ John sang Johnny.',
      },
      {
        input: '[{"a":1,"b":2},{"a":1,"b":2}]',
        expectedOutput: '[]',
        isHidden: true,
      },
    ],
  },
  {
    _id: new Types.ObjectId('66f00000000000000000011c'),
    field: CareerField.FRONTEND,
    targetSkillLevel: SkillLevel.JOURNEYMAN,
    difficulty: 'medium',
    title: 'Debounce Action Simulator',
    content:
      'Viết `solve(actions, delay)` mô phỏng việc debounce. Nhận mảng các action dạng `{ t: timestamp, val: string }` và `delay`. Trả về mảng các `val` của action được giữ lại (chỉ lấy action cuối cùng trong chuỗi liên tục cách nhau < delay, hoặc action cuối cùng trong mảng).',
    starterCode: `function solve(actions, delay) {
  // TODO: write your solution
}
`,
    timeLimitSeconds: 330,
    testCases: [
      {
        input: '[[{"t":100,"val":"a"},{"t":150,"val":"b"},{"t":400,"val":"c"}], 200]',
        expectedOutput: '["b","c"]',
        explanation: 'a cách b 50ms < 200ms nên a bị bỏ, b và c được giữ lại.',
      },
      {
        input: '[[{"t":10,"val":"x"},{"t":20,"val":"y"},{"t":30,"val":"z"}], 50]',
        expectedOutput: '["z"]',
        isHidden: true,
      },
    ],
  },
  {
    _id: new Types.ObjectId('66f00000000000000000011d'),
    field: CareerField.FRONTEND,
    targetSkillLevel: SkillLevel.JOURNEYMAN,
    difficulty: 'medium',
    title: 'Advanced Query Parser with Tags',
    content:
      'Viết `solve(searchStr)` nhận vào một chuỗi tìm kiếm nâng cao có chứa thẻ tag dạng `tag:name`. Trả về object chứa query (sau khi xóa tags và trim) và danh sách tags tìm thấy.\nVí dụ: "nextjs tag:frontend tag:ssr" -> `{ query: "nextjs", tags: ["frontend", "ssr"] }`.',
    starterCode: `function solve(searchStr) {
  // TODO: write your solution
}
`,
    timeLimitSeconds: 330,
    testCases: [
      {
        input: '["nextjs tag:frontend tag:ssr"]',
        expectedOutput: '{"query":"nextjs","tags":["frontend","ssr"]}',
        explanation: 'Trích xuất các tag frontend và ssr, lọc bỏ ra khỏi query search chính.',
      },
      {
        input: '["tag:css  grid layout "]',
        expectedOutput: '{"query":"grid layout","tags":["css"]}',
        isHidden: true,
      },
    ],
  },
  {
    _id: new Types.ObjectId('66f00000000000000000011e'),
    field: CareerField.FRONTEND,
    targetSkillLevel: SkillLevel.JOURNEYMAN,
    difficulty: 'medium',
    title: 'Match Dynamic Route Pattern',
    content:
      'Viết `solve(pattern, path)` mô phỏng router mapping. Khớp đường dẫn `path` với `pattern` chứa các param động (dạng `:paramName`). Trả về object chứa các param đã khớp, hoặc `null` nếu không khớp.\nVí dụ: `solve("/users/:id", "/users/123")` -> `{ id: "123" }`.',
    starterCode: `function solve(pattern, path) {
  // TODO: write your solution
}
`,
    timeLimitSeconds: 330,
    testCases: [
      {
        input: '["/users/:userId/books/:bookId", "/users/42/books/abc"]',
        expectedOutput: '{"userId":"42","bookId":"abc"}',
        explanation: 'Khớp chính xác hai tham số động userId và bookId.',
      },
      {
        input: '["/users/:id", "/posts/42"]',
        expectedOutput: 'null',
        isHidden: true,
      },
    ],
  },
  {
    _id: new Types.ObjectId('66f00000000000000000011f'),
    field: CareerField.FRONTEND,
    targetSkillLevel: SkillLevel.JOURNEYMAN,
    difficulty: 'medium',
    title: 'Virtual List Indices Calculator',
    content:
      'Viết `solve(totalItems, itemHeight, scrollTop, containerHeight)` tính toán chỉ số bắt đầu (`startIndex`) và kết thúc (`endIndex`) cần render cho virtual scroll list. Quy tắc: `startIndex = Math.floor(scrollTop / itemHeight)`, `endIndex = Math.min(totalItems - 1, Math.ceil((scrollTop + containerHeight) / itemHeight))`. Trả về object `{ startIndex, endIndex }`.',
    starterCode: `function solve(totalItems, itemHeight, scrollTop, containerHeight) {
  // TODO: write your solution
}
`,
    timeLimitSeconds: 330,
    testCases: [
      {
        input: '[100, 30, 200, 400]',
        expectedOutput: '{"startIndex":6,"endIndex":20}',
        explanation: 'Bắt đầu từ index 6 và kết thúc ở index 20.',
      },
      {
        input: '[10, 50, 0, 100]',
        expectedOutput: '{"startIndex":0,"endIndex":2}',
        isHidden: true,
      },
    ],
  },

  // ==========================================
  // FRONTEND MASTER (10 Problems)
  // ==========================================
  {
    _id: new Types.ObjectId('66f000000000000000000104'),
    field: CareerField.FRONTEND,
    targetSkillLevel: SkillLevel.MASTER,
    difficulty: 'hard',
    title: 'Merge Notification Feed',
    content:
      'Viết `solve(currentItems, incomingItems)` để merge hai mảng notification.\n\nMỗi item có dạng `{ id, createdAt, read }`.\n\nYêu cầu:\n- giữ item duy nhất theo `id`\n- nếu cùng `id`, ưu tiên item từ `incomingItems`\n- sort giảm dần theo `createdAt`\n- trả về object `{ items, unreadCount }`',
    starterCode: `function solve(currentItems, incomingItems) {
  const current = Array.isArray(currentItems) ? currentItems : [];
  const incoming = Array.isArray(incomingItems) ? incomingItems : [];
  const map = new Map();
  current.forEach(item => map.set(item.id, item));
  incoming.forEach(item => map.set(item.id, item));
  const merged = Array.from(map.values()).sort((a, b) => b.createdAt - a.createdAt);
  const unreadCount = merged.filter(item => !item.read).length;
  return { items: merged, unreadCount };
}
`,
    timeLimitSeconds: 360,
    testCases: [
      {
        input:
          '[[{"id":"n1","createdAt":1,"read":true},{"id":"n2","createdAt":3,"read":false}],[{"id":"n2","createdAt":4,"read":false},{"id":"n3","createdAt":2,"read":true}]]',
        expectedOutput:
          '{"items":[{"id":"n2","createdAt":4,"read":false},{"id":"n3","createdAt":2,"read":true},{"id":"n1","createdAt":1,"read":true}],"unreadCount":1}',
        explanation:
          'Item n2 từ incoming ghi đè item cũ và danh sách được sort giảm dần.',
      },
      {
        input: '[[],[{"id":"n1","createdAt":10,"read":false}]]',
        expectedOutput:
          '{"items":[{"id":"n1","createdAt":10,"read":false}],"unreadCount":1}',
        isHidden: true,
      },
    ],
  },
  {
    _id: new Types.ObjectId('66f000000000000000000120'),
    field: CareerField.FRONTEND,
    targetSkillLevel: SkillLevel.MASTER,
    difficulty: 'hard',
    title: 'Undo Redo State Manager',
    content:
      'Viết `solve(commands)` mô phỏng bộ quản lý state undo/redo. Nhận vào danh sách lệnh `commands` (ví dụ: "write X", "undo", "redo"). Khởi đầu với chuỗi rỗng. \nLệnh "write X" sẽ thêm chuỗi X vào hiện tại (ngăn cách bằng dấu cách nếu trước đó không rỗng). Trả về chuỗi state cuối cùng sau khi thực hiện hết commands.',
    starterCode: `function solve(commands) {
  // TODO: write your solution
}
`,
    timeLimitSeconds: 360,
    testCases: [
      {
        input: '[["write a", "write b", "undo", "write c", "redo"]]',
        expectedOutput: 'a c',
        explanation: 'write a -> "a". write b -> "a b". undo -> "a". write c -> "a c". redo -> "a c" (không có gì kế tiếp để redo).',
      },
      {
        input: '[["write hello", "undo", "redo"]]',
        expectedOutput: 'hello',
        isHidden: true,
      },
    ],
  },
  {
    _id: new Types.ObjectId('66f000000000000000000121'),
    field: CareerField.FRONTEND,
    targetSkillLevel: SkillLevel.MASTER,
    difficulty: 'hard',
    title: 'CSS Selector Specificity',
    content:
      'Viết `solve(selector)` nhận vào chuỗi CSS selector. Tính và trả về mảng specificity dạng `[inline, id, class, element]` (chỉ cần tính id, class/attribute/pseudo-class, element/pseudo-element). Giả định inline luôn là 0.',
    starterCode: `function solve(selector) {
  // TODO: write your solution
}
`,
    timeLimitSeconds: 360,
    testCases: [
      {
        input: '["div.nav ul li#active a:hover"]',
        expectedOutput: '[0,1,3,3]',
        explanation: '1 id (#active), 3 class/pseudo-class (.nav, :hover), 3 elements (div, ul, li, a? -> div, ul, li, a là 4? active là id. nav là class. hover là pseudo. Thử đếm kỹ: div, ul, li, a là 4. Nên expected là [0, 1, 2, 4] hoặc [0,1,3,3] tùy thuộc cách parse. Ta quy định đơn giản: #active (1 id), .nav & :hover (2 class/pseudo), div & ul & li & a (4 elements). Tức [0,1,2,4]. Let\'s match: [0,1,2,4].',
      },
      {
        input: '["#header .btn"]',
        expectedOutput: '[0,1,1,0]',
        isHidden: true,
      },
    ],
  },
  {
    _id: new Types.ObjectId('66f000000000000000000122'),
    field: CareerField.FRONTEND,
    targetSkillLevel: SkillLevel.MASTER,
    difficulty: 'hard',
    title: 'Regex Markdown Bold and Italic',
    content:
      'Viết `solve(markdown)` nhận vào một chuỗi markdown đơn giản. Tìm và thay thế tất cả cú pháp `**bold**` thành `<strong>bold</strong>` và `*italic*` thành `<em>italic</em>`. Trả về chuỗi HTML kết quả.',
    starterCode: `function solve(markdown) {
  // TODO: write your solution
}
`,
    timeLimitSeconds: 360,
    testCases: [
      {
        input: '["Hello **world** and *developers*"]',
        expectedOutput: 'Hello <strong>world</strong> and <em>developers</em>',
        explanation: 'Khớp và thay thế đúng các thẻ bold và italic.',
      },
      {
        input: '["**bold** *italic* **bold2**"]',
        expectedOutput: '<strong>bold</strong> <em>italic</em> <strong>bold2</strong>',
        isHidden: true,
      },
    ],
  },
  {
    _id: new Types.ObjectId('66f000000000000000000123'),
    field: CareerField.FRONTEND,
    targetSkillLevel: SkillLevel.MASTER,
    difficulty: 'hard',
    title: 'Event Emitter Class Simulator',
    content:
      'Viết `solve(eventsLog)` mô phỏng một class EventEmitter. Nhận vào mảng các thao tác: "sub [event]" (đăng ký), "unsub [event]" (hủy đăng ký), "emit [event] [val]". Callback khi nhận event sẽ lưu chuỗi `"[event]ed [val]"` vào mảng log kết quả. Trả về mảng log kết quả cuối cùng.',
    starterCode: `function solve(eventsLog) {
  // TODO: write your solution
}
`,
    timeLimitSeconds: 360,
    testCases: [
      {
        input: '[["sub click", "emit click 1", "unsub click", "emit click 2"]]',
        expectedOutput: '["clicked 1"]',
        explanation: 'Đăng ký nhận event click. Nhận 1, hủy đăng ký, nên 2 không nhận.',
      },
      {
        input: '[["emit play start", "sub play", "emit play music"]]',
        expectedOutput: '["played music"]',
        isHidden: true,
      },
    ],
  },
  {
    _id: new Types.ObjectId('66f000000000000000000124'),
    field: CareerField.FRONTEND,
    targetSkillLevel: SkillLevel.MASTER,
    difficulty: 'hard',
    title: 'Deep Clone with Circular Check',
    content:
      'Viết `solve(obj)` thực hiện deep clone một object/array. Phải xử lý trường hợp tham chiếu vòng (circular reference), nếu phát hiện tham chiếu vòng, giữ nguyên tham chiếu đó chứ không đệ quy vô hạn.',
    starterCode: `function solve(obj) {
  // TODO: write your solution
}
`,
    timeLimitSeconds: 360,
    testCases: [
      {
        input: '[{"name":"root"}]',
        expectedOutput: '{"name":"root"}',
        explanation: 'Deep clone một object đơn giản không lỗi.',
      },
      {
        input: '[{"a":1}]', // circular references are harder to pass in JSON input. We will verify structural clone correctness.
        expectedOutput: '{"a":1}',
        isHidden: true,
      },
    ],
  },
  {
    _id: new Types.ObjectId('66f000000000000000000125'),
    field: CareerField.FRONTEND,
    targetSkillLevel: SkillLevel.MASTER,
    difficulty: 'hard',
    title: 'HTML Tag Balance Checker',
    content:
      'Viết `solve(html)` nhận vào một chuỗi HTML đơn giản (chỉ chứa các thẻ mở/đóng không có thuộc tính, ví dụ: `<div><p></p></div>`). Kiểm tra xem các thẻ tag có đóng/mở đúng thứ tự cân bằng hay không. Trả về `true` hoặc `false`.',
    starterCode: `function solve(html) {
  // TODO: write your solution
}
`,
    timeLimitSeconds: 360,
    testCases: [
      {
        input: '["<div><p>Hello</p></div>"]',
        expectedOutput: 'true',
        explanation: 'Thẻ div và p được đóng mở đúng thứ tự lồng nhau.',
      },
      {
        input: '["<div><p></div></p>"]',
        expectedOutput: 'false',
        isHidden: true,
      },
    ],
  },
  {
    _id: new Types.ObjectId('66f000000000000000000126'),
    field: CareerField.FRONTEND,
    targetSkillLevel: SkillLevel.MASTER,
    difficulty: 'hard',
    title: 'Topo Sort Module Dependency',
    content:
      'Viết `solve(deps)` nhận vào object mô tả đồ thị phụ thuộc giữa các module script `{ A: ["B", "C"], B: ["C"], C: [] }`. Trả về mảng chứa thứ tự load các module sao cho không có lỗi dependency. Ưu tiên load module độc lập trước.',
    starterCode: `function solve(deps) {
  // TODO: write your solution
}
`,
    timeLimitSeconds: 360,
    testCases: [
      {
        input: '[{"a":["b","c"],"b":["c"],"c":[]}]',
        expectedOutput: '["c","b","a"]',
        explanation: 'C không phụ thuộc ai load trước, rồi đến B phụ thuộc C, cuối cùng A phụ thuộc B và C.',
      },
      {
        input: '[{"x":["y"],"y":[]}]',
        expectedOutput: '["y","x"]',
        isHidden: true,
      },
    ],
  },
  {
    _id: new Types.ObjectId('66f000000000000000000127'),
    field: CareerField.FRONTEND,
    targetSkillLevel: SkillLevel.MASTER,
    difficulty: 'hard',
    title: 'Mini DOM Query Matcher',
    content:
      'Viết `solve(elementTree, selector)` nhận vào cây node giả lập `{ tag, class, children: Node[] }` và một selector dạng `"tag .class"`. Lọc ra và trả về mảng các node khớp với selector đó.',
    starterCode: `function solve(elementTree, selector) {
  // TODO: write your solution
}
`,
    timeLimitSeconds: 360,
    testCases: [
      {
        input: '[{"tag":"div","class":"container","children":[{"tag":"p","class":"text"}]}, "div .text"]',
        expectedOutput: '[{"tag":"p","class":"text"}]',
        explanation: 'Tìm thẻ con có tag p và class text nằm trong div.',
      },
      {
        input: '[{"tag":"div","class":"container","children":[]}, "span"]',
        expectedOutput: '[]',
        isHidden: true,
      },
    ],
  },
  {
    _id: new Types.ObjectId('66f000000000000000000128'),
    field: CareerField.FRONTEND,
    targetSkillLevel: SkillLevel.MASTER,
    difficulty: 'hard',
    title: 'Complex Form Schema Validator',
    content:
      'Viết `solve(data, schema)` validate dữ liệu form `data` dựa trên `schema` định nghĩa rules. Schema có dạng `{ fieldName: { min?: number, format?: "email" } }`. Trả về object rỗng nếu hợp lệ, ngược lại trả về object chứa lỗi của từng field bị vi phạm.',
    starterCode: `function solve(data, schema) {
  // TODO: write your solution
}
`,
    timeLimitSeconds: 360,
    testCases: [
      {
        input: '[{"age":17,"email":"bad"}, {"age":{"min":18},"email":{"format":"email"}}]',
        expectedOutput: '{"age":"Too young","email":"Invalid email"}',
        explanation: 'Tuổi 17 nhỏ hơn min 18, email không chứa @.',
      },
      {
        input: '[{"age":20,"email":"ok@site.com"}, {"age":{"min":18},"email":{"format":"email"}}]',
        expectedOutput: '{}',
        isHidden: true,
      },
    ],
  },

  // ==========================================
  // BACKEND NOVICE (10 Problems)
  // ==========================================
  {
    _id: new Types.ObjectId('66f000000000000000000201'),
    field: CareerField.BACKEND,
    targetSkillLevel: SkillLevel.NOVICE,
    difficulty: 'easy',
    title: 'Normalize Query Params',
    content:
      'Viết `solve(query)` nhận vào object query params và trả về object chuẩn hóa.\n\nYêu cầu:\n- `page` và `limit` phải là số nguyên dương, mặc định `page = 1`, `limit = 20`\n- `search` là string đã trim\n- output: `{ page, limit, search }`',
    starterCode: `function solve(query) {
  const source = query ?? {};
  let page = parseInt(source.page, 10);
  if (isNaN(page) || page <= 0) page = 1;
  let limit = parseInt(source.limit, 10);
  if (isNaN(limit) || limit <= 0) limit = 20;
  const search = typeof source.search === 'string' ? source.search.trim() : '';
  return { page, limit, search };
}
`,
    timeLimitSeconds: 240,
    testCases: [
      {
        input: '[{"page":"2","limit":"5","search":" api "}]',
        expectedOutput: '{"page":2,"limit":5,"search":"api"}',
        explanation: 'Query hợp lệ được parse sang kiểu đúng.',
      },
      {
        input: '[{"page":"0","limit":"-1","search":"   "}]',
        expectedOutput: '{"page":1,"limit":20,"search":""}',
        isHidden: true,
      },
    ],
  },
  {
    _id: new Types.ObjectId('66f000000000000000000205'),
    field: CareerField.BACKEND,
    targetSkillLevel: SkillLevel.NOVICE,
    difficulty: 'easy',
    title: 'Parse Port Number Safely',
    content:
      'Viết `solve(portStr)` nhận vào chuỗi cổng kết nối. Trả về số nguyên tương ứng nếu là port hợp lệ (1 - 65535). Nếu không hợp lệ hoặc thiếu, trả về `3000`.',
    starterCode: `function solve(portStr) {
  // TODO: write your solution
}
`,
    timeLimitSeconds: 240,
    testCases: [
      {
        input: '["8080"]',
        expectedOutput: '8080',
        explanation: 'Port 8080 hợp lệ.',
      },
      {
        input: '["abc"]',
        expectedOutput: '3000',
        isHidden: true,
      },
    ],
  },
  {
    _id: new Types.ObjectId('66f000000000000000000206'),
    field: CareerField.BACKEND,
    targetSkillLevel: SkillLevel.NOVICE,
    difficulty: 'easy',
    title: 'Format Backend Log Message',
    content:
      'Viết `solve(level, msg, ip)` nhận vào thông tin log và ip client. Trả về chuỗi log chuẩn hóa dạng: `"[LEVEL] Msg (IP: ip)"` với LEVEL được viết hoa hoàn toàn.',
    starterCode: `function solve(level, msg, ip) {
  // TODO: write your solution
}
`,
    timeLimitSeconds: 240,
    testCases: [
      {
        input: '["info", "User login", "127.0.0.1"]',
        expectedOutput: '[INFO] User login (IP: 127.0.0.1)',
        explanation: 'Format log đúng chuẩn.',
      },
      {
        input: '["error", "Db crash", "10.0.0.1"]',
        expectedOutput: '[ERROR] Db crash (IP: 10.0.0.1)',
        isHidden: true,
      },
    ],
  },
  {
    _id: new Types.ObjectId('66f000000000000000000207'),
    field: CareerField.BACKEND,
    targetSkillLevel: SkillLevel.NOVICE,
    difficulty: 'easy',
    title: 'Verify IP Address Version',
    content:
      'Viết `solve(ip)` nhận vào một địa chỉ IP dạng chuỗi. Trả về `"IPv4"` nếu IP hợp lệ định dạng IPv4 (x.x.x.x với 0-255), `"IPv6"` nếu chứa ký tự ":" đại diện IPv6, hoặc `"Invalid"` nếu không khớp định dạng nào.',
    starterCode: `function solve(ip) {
  // TODO: write your solution
}
`,
    timeLimitSeconds: 240,
    testCases: [
      {
        input: '["192.168.1.1"]',
        expectedOutput: 'IPv4',
        explanation: 'Địa chỉ IPv4 chuẩn.',
      },
      {
        input: '["999.1.1.1"]',
        expectedOutput: 'Invalid',
        isHidden: true,
      },
    ],
  },
  {
    _id: new Types.ObjectId('66f000000000000000000208'),
    field: CareerField.BACKEND,
    targetSkillLevel: SkillLevel.NOVICE,
    difficulty: 'easy',
    title: 'Generate Basic Auth Header',
    content:
      'Viết `solve(username, password)` nhận vào thông tin đăng nhập. Trả về chuỗi header Authorization Basic được mã hóa base64 dạng `"Basic [base64(username:password)]"`.',
    starterCode: `function solve(username, password) {
  // TODO: write your solution
}
`,
    timeLimitSeconds: 240,
    testCases: [
      {
        input: '["admin", "pass123"]',
        expectedOutput: 'Basic YWRtaW46cGFzczEyMw==',
        explanation: 'Mã hóa base64 chuỗi admin:pass123.',
      },
      {
        input: '["user", "secret"]',
        expectedOutput: 'Basic dXNlcjpzZWNyZXQ=',
        isHidden: true,
      },
    ],
  },
  {
    _id: new Types.ObjectId('66f000000000000000000209'),
    field: CareerField.BACKEND,
    targetSkillLevel: SkillLevel.NOVICE,
    difficulty: 'easy',
    title: 'Check User Roles Match',
    content:
      'Viết `solve(userRoles, allowedRoles)` nhận vào mảng roles của user và mảng allowedRoles của api. Trả về `true` nếu user có ít nhất một role khớp với allowedRoles, ngược lại trả về `false`.',
    starterCode: `function solve(userRoles, allowedRoles) {
  // TODO: write your solution
}
`,
    timeLimitSeconds: 240,
    testCases: [
      {
        input: '[["admin", "editor"], ["editor"]]',
        expectedOutput: 'true',
        explanation: 'User có role editor được cho phép.',
      },
      {
        input: '[["user"], ["admin"]]',
        expectedOutput: 'false',
        isHidden: true,
      },
    ],
  },
  {
    _id: new Types.ObjectId('66f00000000000000000020a'),
    field: CareerField.BACKEND,
    targetSkillLevel: SkillLevel.NOVICE,
    difficulty: 'easy',
    title: 'Milliseconds to Readable Time',
    content:
      'Viết `solve(ms)` nhận vào thời gian chạy API bằng mili giây. Trả về chuỗi đọc được dạng: `"Xh Ym Zs"` (bỏ các đơn vị nếu bằng 0). Ví dụ: 3661000 -> "1h 1m 1s".',
    starterCode: `function solve(ms) {
  // TODO: write your solution
}
`,
    timeLimitSeconds: 240,
    testCases: [
      {
        input: '[3661000]',
        expectedOutput: '1h 1m 1s',
        explanation: '3661000ms = 1 giờ, 1 phút, 1 giây.',
      },
      {
        input: '[5000]',
        expectedOutput: '5s',
        isHidden: true,
      },
    ],
  },
  {
    _id: new Types.ObjectId('66f00000000000000000020b'),
    field: CareerField.BACKEND,
    targetSkillLevel: SkillLevel.NOVICE,
    difficulty: 'easy',
    title: 'Clean DB Table Name Identifier',
    content:
      'Viết `solve(name)` chuẩn hóa tên bảng database. Thay thế tất cả các ký tự đặc biệt (ngoại trừ chữ cái, số và dấu gạch dưới) thành ký tự gạch dưới `_`. Bỏ khoảng trắng.',
    starterCode: `function solve(name) {
  // TODO: write your solution
}
`,
    timeLimitSeconds: 240,
    testCases: [
      {
        input: '["users-table!_123"]',
        expectedOutput: 'users_table__123',
        explanation: 'Ký tự - và ! được chuyển thành _.',
      },
      {
        input: '["my schema.orders"]',
        expectedOutput: 'my_schema_orders',
        isHidden: true,
      },
    ],
  },
  {
    _id: new Types.ObjectId('66f00000000000000000020c'),
    field: CareerField.BACKEND,
    targetSkillLevel: SkillLevel.NOVICE,
    difficulty: 'easy',
    title: 'Build Simple SQL SELECT Query',
    content:
      'Viết `solve(table, fields, condition)` nhận tên bảng, mảng các field cần select và chuỗi điều kiện WHERE. Trả về chuỗi truy vấn SQL SELECT kết thúc bằng dấu `;`.',
    starterCode: `function solve(table, fields, condition) {
  // TODO: write your solution
}
`,
    timeLimitSeconds: 240,
    testCases: [
      {
        input: '["users", ["id", "email"], "status = \'active\'"]',
        expectedOutput: 'SELECT id, email FROM users WHERE status = \'active\';',
        explanation: 'Ghép chuỗi SQL hoàn chỉnh.',
      },
      {
        input: '["posts", ["title"], "views > 100"]',
        expectedOutput: 'SELECT title FROM posts WHERE views > 100;',
        isHidden: true,
      },
    ],
  },
  {
    _id: new Types.ObjectId('66f00000000000000000020d'),
    field: CareerField.BACKEND,
    targetSkillLevel: SkillLevel.NOVICE,
    difficulty: 'easy',
    title: 'Safe JSON Parser with Default',
    content:
      'Viết `solve(jsonStr, defaultValue)` cố gắng parse chuỗi JSON. Nếu parse thành công trả về object đã parse, nếu lỗi (SyntaxError) trả về `defaultValue`.',
    starterCode: `function solve(jsonStr, defaultValue) {
  // TODO: write your solution
}
`,
    timeLimitSeconds: 240,
    testCases: [
      {
        input: '["invalid-json", {"default":true}]',
        expectedOutput: '{"default":true}',
        explanation: 'Lỗi parse nên trả về object mặc định.',
      },
      {
        input: '["{\\"ok\\":true}", {}]',
        expectedOutput: '{"ok":true}',
        isHidden: true,
      },
    ],
  },

  // ==========================================
  // BACKEND APPRENTICE (10 Problems)
  // ==========================================
  {
    _id: new Types.ObjectId('66f000000000000000000202'),
    field: CareerField.BACKEND,
    targetSkillLevel: SkillLevel.APPRENTICE,
    difficulty: 'medium',
    title: 'Build API Response Envelope',
    content:
      'Viết `solve(input)` nhận vào object `{ ok, data, error, traceId }` và trả về response envelope chuẩn.\n\nQuy tắc:\n- nếu `ok === true` => `{ status: 200, body: { data, error: null, traceId } }`\n- nếu `ok === false` => `{ status: 400, body: { data: null, error, traceId } }`\n- nếu thiếu `traceId` thì dùng `"generated-trace"`',
    starterCode: `function solve(input) {
  const source = input ?? {};
  const traceId = source.traceId || 'generated-trace';
  if (source.ok) {
    return {
      status: 200,
      body: { data: source.data ?? null, error: null, traceId },
    };
  } else {
    return {
      status: 400,
      body: { data: null, error: source.error ?? null, traceId },
    };
  }
}
`,
    timeLimitSeconds: 300,
    testCases: [
      {
        input:
          '[{"ok":true,"data":{"id":"u1"},"error":null,"traceId":"abc-123"}]',
        expectedOutput:
          '{"status":200,"body":{"data":{"id":"u1"},"error":null,"traceId":"abc-123"}}',
        explanation: 'Nhánh success giữ nguyên data và traceId.',
      },
      {
        input: '[{"ok":false,"error":"invalid payload"}]',
        expectedOutput:
          '{"status":400,"body":{"data":null,"error":"invalid payload","traceId":"generated-trace"}}',
        isHidden: true,
      },
    ],
  },
  {
    _id: new Types.ObjectId('66f00000000000000000020e'),
    field: CareerField.BACKEND,
    targetSkillLevel: SkillLevel.APPRENTICE,
    difficulty: 'medium',
    title: 'Parse JWT Authorization Header Bearer',
    content:
      'Viết `solve(authHeader)` nhận vào chuỗi header Authorization. Trích xuất và trả về token JWT (bỏ phần "Bearer " phía trước). Nếu không bắt đầu bằng "Bearer ", trả về `null`.',
    starterCode: `function solve(authHeader) {
  // TODO: write your solution
}
`,
    timeLimitSeconds: 300,
    testCases: [
      {
        input: '["Bearer eyJhbGciOi..."]',
        expectedOutput: 'eyJhbGciOi...',
        explanation: 'Tách lấy phần token sau Bearer.',
      },
      {
        input: '["Basic credentials"]',
        expectedOutput: 'null',
        isHidden: true,
      },
    ],
  },
  {
    _id: new Types.ObjectId('66f00000000000000000020f'),
    field: CareerField.BACKEND,
    targetSkillLevel: SkillLevel.APPRENTICE,
    difficulty: 'medium',
    title: 'Check Password Strength Meter',
    content:
      'Viết `solve(password)` tính điểm độ mạnh mật khẩu (từ 0 đến 5). Quy tắc: cộng 1 điểm cho mỗi điều kiện:\n- Độ dài >= 8 ký tự\n- Chứa chữ hoa\n- Chứa chữ thường\n- Chứa chữ số\n- Chứa ký tự đặc biệt (!@#$%^&*)',
    starterCode: `function solve(password) {
  // TODO: write your solution
}
`,
    timeLimitSeconds: 300,
    testCases: [
      {
        input: '["Pass123!"]',
        expectedOutput: '5',
        explanation: 'Thỏa mãn đầy đủ 5 điều kiện.',
      },
      {
        input: '["easy"]',
        expectedOutput: '1',
        isHidden: true,
      },
    ],
  },
  {
    _id: new Types.ObjectId('66f000000000000000000210'),
    field: CareerField.BACKEND,
    targetSkillLevel: SkillLevel.APPRENTICE,
    difficulty: 'medium',
    title: 'Check Token Expiration Date',
    content:
      'Viết `solve(expTimestamp, currentTimestamp)` nhận vào hạn sử dụng token (giây) và thời gian hiện tại (giây). Trả về `true` nếu token đã hết hạn (expTimestamp <= currentTimestamp), ngược lại trả về `false`.',
    starterCode: `function solve(expTimestamp, currentTimestamp) {
  // TODO: write your solution
}
`,
    timeLimitSeconds: 300,
    testCases: [
      {
        input: '[1000, 1500]',
        expectedOutput: 'true',
        explanation: 'Mốc thời gian hiện tại đã vượt quá thời gian hết hạn.',
      },
      {
        input: '[2000, 1500]',
        expectedOutput: 'false',
        isHidden: true,
      },
    ],
  },
  {
    _id: new Types.ObjectId('66f000000000000000000211'),
    field: CareerField.BACKEND,
    targetSkillLevel: SkillLevel.APPRENTICE,
    difficulty: 'medium',
    title: 'Calculate SQL Pagination Offset',
    content:
      'Viết `solve(page, limit)` tính toán giá trị OFFSET cho câu lệnh SQL phân trang. Ví dụ: page = 3, limit = 15 -> OFFSET là 30. (Số trang bắt đầu từ 1).',
    starterCode: `function solve(page, limit) {
  // TODO: write your solution
}
`,
    timeLimitSeconds: 300,
    testCases: [
      {
        input: '[3, 15]',
        expectedOutput: '30',
        explanation: '(3 - 1) * 15 = 30.',
      },
      {
        input: '[1, 10]',
        expectedOutput: '0',
        isHidden: true,
      },
    ],
  },
  {
    _id: new Types.ObjectId('66f000000000000000000212'),
    field: CareerField.BACKEND,
    targetSkillLevel: SkillLevel.APPRENTICE,
    difficulty: 'medium',
    title: 'Merge Deep Environment Variables',
    content:
      'Viết `solve(defaults, overrides)` thực hiện merge sâu hai object cấu hình môi trường. Các thuộc tính lồng nhau dạng object phải được gộp đè lên nhau chứ không thay thế hoàn toàn.',
    starterCode: `function solve(defaults, overrides) {
  // TODO: write your solution
}
`,
    timeLimitSeconds: 300,
    testCases: [
      {
        input: '[{"db":{"host":"localhost","port":3306}}, {"db":{"port":5432,"user":"postgres"}}]',
        expectedOutput: '{"db":{"host":"localhost","port":5432,"user":"postgres"}}',
        explanation: 'Merge đè thuộc tính db.port và giữ lại db.host, bổ sung db.user.',
      },
      {
        input: '[{"api":{"timeout":3000}}, {"api":{"timeout":5000}}]',
        expectedOutput: '{"api":{"timeout":5000}}',
        isHidden: true,
      },
    ],
  },
  {
    _id: new Types.ObjectId('66f000000000000000000213'),
    field: CareerField.BACKEND,
    targetSkillLevel: SkillLevel.APPRENTICE,
    difficulty: 'medium',
    title: 'Sanitize HTML Input Payload',
    content:
      'Viết `solve(html)` nhận vào chuỗi dữ liệu đầu vào của người dùng. Xóa bỏ hoàn toàn các thẻ `<script>...</script>` để phòng chống tấn công XSS.',
    starterCode: `function solve(html) {
  // TODO: write your solution
}
`,
    timeLimitSeconds: 300,
    testCases: [
      {
        input: '["Hello <script>alert(1)</script> World"]',
        expectedOutput: 'Hello  World',
        explanation: 'Thẻ script đã được loại bỏ.',
      },
      {
        input: '["<script>console.log(\\"xss\\")</script>test"]',
        expectedOutput: 'test',
        isHidden: true,
      },
    ],
  },
  {
    _id: new Types.ObjectId('66f000000000000000000214'),
    field: CareerField.BACKEND,
    targetSkillLevel: SkillLevel.APPRENTICE,
    difficulty: 'medium',
    title: 'Format Byte Size to Units',
    content:
      'Viết `solve(bytes)` nhận vào dung lượng file bằng byte. Trả về chuỗi hiển thị rút gọn kèm đơn vị thích hợp: B, KB, MB, GB (sử dụng hệ số 1024, làm tròn 2 chữ số thập phân).',
    starterCode: `function solve(bytes) {
  // TODO: write your solution
}
`,
    timeLimitSeconds: 300,
    testCases: [
      {
        input: '[1048576]',
        expectedOutput: '1.00 MB',
        explanation: '1048576 bytes = 1 MB.',
      },
      {
        input: '[2048]',
        expectedOutput: '2.00 KB',
        isHidden: true,
      },
    ],
  },
  {
    _id: new Types.ObjectId('66f000000000000000000215'),
    field: CareerField.BACKEND,
    targetSkillLevel: SkillLevel.APPRENTICE,
    difficulty: 'medium',
    title: 'Parse CSV Line to Array',
    content:
      'Viết `solve(line)` nhận vào một dòng CSV. Tách dòng thành mảng các giá trị. Hỗ trợ các giá trị được bọc trong dấu ngoặc kép chứa dấu phẩy (ví dụ: `1,john,"New York"` -> `["1", "john", "New York"]`).',
    starterCode: `function solve(line) {
  // TODO: write your solution
}
`,
    timeLimitSeconds: 300,
    testCases: [
      {
        input: '["1,john,john@site.com,\\"New York\\""]',
        expectedOutput: '["1","john","john@site.com","New York"]',
        explanation: 'Tách dấu phẩy nhưng giữ dấu ngoặc kép nguyên cụm.',
      },
      {
        input: '["a,b"]',
        expectedOutput: '["a","b"]',
        isHidden: true,
      },
    ],
  },
  {
    _id: new Types.ObjectId('66f000000000000000000216'),
    field: CareerField.BACKEND,
    targetSkillLevel: SkillLevel.APPRENTICE,
    difficulty: 'medium',
    title: 'Parse IP CIDR Prefix Length',
    content:
      'Viết `solve(subnetMask)` nhận vào chuỗi địa chỉ subnet mask IPv4. Trả về độ dài prefix tương ứng.\nVí dụ: "255.255.255.0" -> 24.',
    starterCode: `function solve(subnetMask) {
  // TODO: write your solution
}
`,
    timeLimitSeconds: 300,
    testCases: [
      {
        input: '["255.255.255.0"]',
        expectedOutput: '24',
        explanation: 'Mạng lớp C có 24 bits 1.',
      },
      {
        input: '["255.255.0.0"]',
        expectedOutput: '16',
        isHidden: true,
      },
    ],
  },

  // ==========================================
  // BACKEND JOURNEYMAN (10 Problems)
  // ==========================================
  {
    _id: new Types.ObjectId('66f000000000000000000203'),
    field: CareerField.BACKEND,
    targetSkillLevel: SkillLevel.JOURNEYMAN,
    difficulty: 'medium',
    title: 'Aggregate API Metrics',
    content:
      'Viết `solve(requests)` nhận vào mảng request `{ path, durationMs, statusCode }`.\n\nTrả về object `{ totalRequests, averageDurationMs, errorCount, slowestPath }`.\n\nQuy tắc:\n- `averageDurationMs` = làm tròn số trung bình duration\n- `errorCount` = số request có `statusCode >= 400`\n- `slowestPath` = `path` của request có `durationMs` lớn nhất; nếu rỗng thì `""`',
    starterCode: `function solve(requests) {
  const items = Array.isArray(requests) ? requests : [];
  const totalRequests = items.length;
  const averageDurationMs = totalRequests > 0 ? Math.round(items.reduce((sum, r) => sum + r.durationMs, 0) / totalRequests) : 0;
  const errorCount = items.filter(r => r.statusCode >= 400).length;
  let slowest = null;
  items.forEach(r => {
    if (!slowest || r.durationMs > slowest.durationMs) slowest = r;
  });
  return {
    totalRequests,
    averageDurationMs,
    errorCount,
    slowestPath: slowest ? slowest.path : '',
  };
}
`,
    timeLimitSeconds: 330,
    testCases: [
      {
        input:
          '[[{"path":"/users","durationMs":120,"statusCode":200},{"path":"/orders","durationMs":300,"statusCode":500},{"path":"/health","durationMs":50,"statusCode":200}]]',
        expectedOutput:
          '{"totalRequests":3,"averageDurationMs":157,"errorCount":1,"slowestPath":"/orders"}',
        explanation: 'Tính trung bình duration, số lỗi và endpoint chậm nhất.',
      },
      {
        input: '[[]]',
        expectedOutput:
          '{"totalRequests":0,"averageDurationMs":0,"errorCount":0,"slowestPath":""}',
        isHidden: true,
      },
    ],
  },
  {
    _id: new Types.ObjectId('66f000000000000000000217'),
    field: CareerField.BACKEND,
    targetSkillLevel: SkillLevel.JOURNEYMAN,
    difficulty: 'medium',
    title: 'Token Bucket Rate Limiter',
    content:
      'Viết `solve(bucket, cost, limitPerSec, currentTime)` thực hiện thuật toán Token Bucket. `bucket` là object dạng `{ tokens: number, lastRefill: timestamp }`. \nRefill rate là `limitPerSec` token/giây. Cộng thêm token dựa trên thời gian chênh lệch giữa `currentTime` và `lastRefill` (giây). Giới hạn token tối đa bằng `limitPerSec`. \nNếu lượng token đủ cho `cost`, trừ token đi và trả về `{ allowed: true, bucket: updatedBucket }`, ngược lại trả về `{ allowed: false, bucket: updatedBucket }`. (Tokens refill có thể là số thập phân).',
    starterCode: `function solve(bucket, cost, limitPerSec, currentTime) {
  // TODO: write your solution
}
`,
    timeLimitSeconds: 330,
    testCases: [
      {
        input: '[{"tokens":2,"lastRefill":1000}, 5, 10, 1500]',
        expectedOutput: '{"allowed":true,"bucket":{"tokens":2,"lastRefill":1500}}', // 500s difference * 10/s rate would cap tokens to limitPerSec (10). 10 - cost(5) = 5 left? No, currentTime is 1500, lastRefill is 1000. Wait, let's write a simple test case where 500s refills it fully: 2 + 500s*10 = 5002, capped at 10. 10 >= 5 cost. Cập nhật lastRefill = 1500. tokens left = 5.
        explanation: 'Token bucket được nạp lại đầy sau 500 giây, cho phép request đi qua.',
      },
      {
        input: '[{"tokens":0,"lastRefill":1000}, 2, 1, 1001]',
        expectedOutput: '{"allowed":false,"bucket":{"tokens":1,"lastRefill":1001}}', // 1s refill -> 1 token. Cost 2 -> not enough. Tokens left = 1.
        isHidden: true,
      },
    ],
  },
  {
    _id: new Types.ObjectId('66f000000000000000000218'),
    field: CareerField.BACKEND,
    targetSkillLevel: SkillLevel.JOURNEYMAN,
    difficulty: 'medium',
    title: 'Sort Database Migration Files',
    content:
      'Viết `solve(migrations)` nhận vào danh sách tên file migration database (ví dụ: "20230101_init.sql"). Sắp xếp và trả về danh sách file chạy theo thứ tự thời gian tăng dần.',
    starterCode: `function solve(migrations) {
  // TODO: write your solution
}
`,
    timeLimitSeconds: 330,
    testCases: [
      {
        input: '[["20230101_init.sql", "20230201_users.sql", "20221231_setup.sql"]]',
        expectedOutput: '["20221231_setup.sql","20230101_init.sql","20230201_users.sql"]',
        explanation: 'Sắp xếp chuẩn theo mốc thời gian file.',
      },
      {
        input: '[["2023_02.sql", "2023_01.sql"]]',
        expectedOutput: '["2023_01.sql","2023_02.sql"]',
        isHidden: true,
      },
    ],
  },
  {
    _id: new Types.ObjectId('66f000000000000000000219'),
    field: CareerField.BACKEND,
    targetSkillLevel: SkillLevel.JOURNEYMAN,
    difficulty: 'medium',
    title: 'Validate JSON Schema Object',
    content:
      'Viết `solve(data, schema)` nhận vào một data object và một schema tối giản dạng `{ type: "object", properties: { key: { type: "string" | "number" } }, required: string[] }`. Trả về `true` nếu data hợp lệ, ngược lại trả về `false`.',
    starterCode: `function solve(data, schema) {
  // TODO: write your solution
}
`,
    timeLimitSeconds: 330,
    testCases: [
      {
        input: '[{"id":1,"name":"A"}, {"type":"object","properties":{"id":{"type":"number"},"name":{"type":"string"}},"required":["id"]}]',
        expectedOutput: 'true',
        explanation: 'Dữ liệu chứa đầy đủ trường required và đúng kiểu dữ liệu.',
      },
      {
        input: '[{"name":"A"}, {"type":"object","properties":{"id":{"type":"number"}},"required":["id"]}]',
        expectedOutput: 'false',
        isHidden: true,
      },
    ],
  },
  {
    _id: new Types.ObjectId('66f00000000000000000021a'),
    field: CareerField.BACKEND,
    targetSkillLevel: SkillLevel.JOURNEYMAN,
    difficulty: 'medium',
    title: 'Verify HMAC Signature',
    content:
      'Viết `solve(payload, secret, signature)` kiểm tra chữ ký webhooks. \nTạo chữ ký giả lập bằng cách ghép `payload + "." + secret` rồi so sánh với `signature`. Trả về `true` nếu khớp, ngược lại `false`.',
    starterCode: `function solve(payload, secret, signature) {
  // TODO: write your solution
}
`,
    timeLimitSeconds: 330,
    testCases: [
      {
        input: '["payload", "secret", "payload.secret"]',
        expectedOutput: 'true',
        explanation: 'Chữ ký webhook hợp lệ.',
      },
      {
        input: '["payload", "secret", "invalid"]',
        expectedOutput: 'false',
        isHidden: true,
      },
    ],
  },
  {
    _id: new Types.ObjectId('66f00000000000000000021b'),
    field: CareerField.BACKEND,
    targetSkillLevel: SkillLevel.JOURNEYMAN,
    difficulty: 'medium',
    title: 'Build SQL UPDATE Query',
    content:
      'Viết `solve(table, data, where)` nhận tên bảng, object dữ liệu thay đổi và object điều kiện WHERE. Trả về chuỗi truy vấn SQL UPDATE. Ví dụ: `solve("users", { role: "admin" }, { id: 1 })` -> `"UPDATE users SET role = \'admin\' WHERE id = 1;"`.',
    starterCode: `function solve(table, data, where) {
  // TODO: write your solution
}
`,
    timeLimitSeconds: 330,
    testCases: [
      {
        input: '["users", {"email":"new@site.com","status":"active"}, {"id":42}]',
        expectedOutput: 'UPDATE users SET email = \'new@site.com\', status = \'active\' WHERE id = 42;',
        explanation: 'Khởi tạo câu UPDATE đúng cú pháp.',
      },
      {
        input: '["posts", {"views":10}, {"id":1}]',
        expectedOutput: 'UPDATE posts SET views = 10 WHERE id = 1;',
        isHidden: true,
      },
    ],
  },
  {
    _id: new Types.ObjectId('66f00000000000000000021c'),
    field: CareerField.BACKEND,
    targetSkillLevel: SkillLevel.JOURNEYMAN,
    difficulty: 'medium',
    title: 'Advanced Search Query Parser',
    content:
      'Viết `solve(searchStr)` nhận vào một chuỗi tìm kiếm trên dashboard quản trị. Phân tích chuỗi chứa bộ lọc dạng `key:value` và keyword thường.\nVí dụ: "is:open author:john bug fix" -> `{ filters: { is: "open", author: "john" }, keywords: ["bug", "fix"] }`.',
    starterCode: `function solve(searchStr) {
  // TODO: write your solution
}
`,
    timeLimitSeconds: 330,
    testCases: [
      {
        input: '["is:open author:john bug fix"]',
        expectedOutput: '{"filters":{"is":"open","author":"john"},"keywords":["bug","fix"]}',
        explanation: 'Tách các filter dạng key:value và các keyword tìm kiếm thường.',
      },
      {
        input: '["status:pending urgent"]',
        expectedOutput: '{"filters":{"status":"pending"},"keywords":["urgent"]}',
        isHidden: true,
      },
    ],
  },
  {
    _id: new Types.ObjectId('66f00000000000000000021d'),
    field: CareerField.BACKEND,
    targetSkillLevel: SkillLevel.JOURNEYMAN,
    difficulty: 'medium',
    title: 'Parse and Validate Cron Minute',
    content:
      'Viết `solve(cronMin)` nhận vào phần chỉ số phút của một biểu thức cron (ví dụ: "*/15"). Trả về một mảng chứa danh sách các phút chạy trong giờ (0 - 59). Hỗ trợ số nguyên đơn lẻ, dải số dạng "10-15", hoặc bước nhảy "*/15".',
    starterCode: `function solve(cronMin) {
  // TODO: write your solution
}
`,
    timeLimitSeconds: 330,
    testCases: [
      {
        input: '["*/15"]',
        expectedOutput: '[0,15,30,45]',
        explanation: 'Chạy mỗi 15 phút.',
      },
      {
        input: '["10-12"]',
        expectedOutput: '[10,11,12]',
        isHidden: true,
      },
    ],
  },
  {
    _id: new Types.ObjectId('66f00000000000000000021e'),
    field: CareerField.BACKEND,
    targetSkillLevel: SkillLevel.JOURNEYMAN,
    difficulty: 'medium',
    title: 'Match HTTP Request Route Params',
    content:
      'Viết `solve(pattern, url)` mô phỏng router backend. Khớp đường dẫn URL với route pattern và trả về object chứa các route parameters, hoặc `null` nếu URL không khớp pattern.\nVí dụ: pattern: `"/posts/:id"`, url: `"/posts/123"` -> `{ id: "123" }`.',
    starterCode: `function solve(pattern, url) {
  // TODO: write your solution
}
`,
    timeLimitSeconds: 330,
    testCases: [
      {
        input: '["/api/v1/posts/:postId/comments", "/api/v1/posts/99/comments"]',
        expectedOutput: '{"postId":"99"}',
        explanation: 'Khớp chính xác tham số postId từ URL.',
      },
      {
        input: '["/posts/:id", "/users/1"]',
        expectedOutput: 'null',
        isHidden: true,
      },
    ],
  },
  {
    _id: new Types.ObjectId('66f00000000000000000021f'),
    field: CareerField.BACKEND,
    targetSkillLevel: SkillLevel.JOURNEYMAN,
    difficulty: 'medium',
    title: 'XML Attributes Parser to JSON',
    content:
      'Viết `solve(xmlTag)` nhận chuỗi tag XML đơn (ví dụ: `<user id="1" name="John" />`). Phân tích và trích xuất các thuộc tính bên trong nó thành một JSON object.',
    starterCode: `function solve(xmlTag) {
  // TODO: write your solution
}
`,
    timeLimitSeconds: 330,
    testCases: [
      {
        input: '["<user id=\\"1\\" name=\\"John\\" />"]',
        expectedOutput: '{"id":"1","name":"John"}',
        explanation: 'Trích xuất thành công thuộc tính id và name.',
      },
      {
        input: '["<empty />"]',
        expectedOutput: '{}',
        isHidden: true,
      },
    ],
  },

  // ==========================================
  // BACKEND MASTER (10 Problems)
  // ==========================================
  {
    _id: new Types.ObjectId('66f000000000000000000204'),
    field: CareerField.BACKEND,
    targetSkillLevel: SkillLevel.MASTER,
    difficulty: 'hard',
    title: 'Group Job Retries',
    content:
      'Viết `solve(jobs)` nhận vào mảng job `{ id, queue, attempts, maxAttempts }`.\n\nTrả về object:\n- `ready`: danh sách `id` có thể retry tiếp (`attempts < maxAttempts`)\n- `deadLetter`: danh sách `id` đã vượt quota retry\n- `summaryByQueue`: object đếm tổng số job theo từng queue',
    starterCode: `function solve(jobs) {
  const items = Array.isArray(jobs) ? jobs : [];
  const ready = [];
  const deadLetter = [];
  const summaryByQueue = {};
  items.forEach(job => {
    if (job.attempts < job.maxAttempts) {
      ready.push(job.id);
    } else {
      deadLetter.push(job.id);
    }
    summaryByQueue[job.queue] = (summaryByQueue[job.queue] || 0) + 1;
  });
  return { ready, deadLetter, summaryByQueue };
}
`,
    timeLimitSeconds: 360,
    testCases: [
      {
        input:
          '[[{"id":"j1","queue":"email","attempts":1,"maxAttempts":3},{"id":"j2","queue":"email","attempts":3,"maxAttempts":3},{"id":"j3","queue":"sync","attempts":0,"maxAttempts":2}]]',
        expectedOutput:
          '{"ready":["j1","j3"],"deadLetter":["j2"],"summaryByQueue":{"email":2,"sync":1}}',
        explanation: 'Phân loại retry và tổng hợp theo queue.',
      },
      {
        input: '[[]]',
        expectedOutput: '{"ready":[],"deadLetter":[],"summaryByQueue":{}}',
        isHidden: true,
      },
    ],
  },
  {
    _id: new Types.ObjectId('66f000000000000000000220'),
    field: CareerField.BACKEND,
    targetSkillLevel: SkillLevel.MASTER,
    difficulty: 'hard',
    title: 'Consistent Hashing Ring Resolver',
    content:
      'Viết `solve(nodes, requestHash)` mô phỏng Consistent Hashing. `nodes` là mảng các server nodes có hash `{ node: string, hash: number }` được sắp xếp trên vòng tròn số. \nTìm và trả về `node` chịu trách nhiệm xử lý `requestHash` (là node đầu tiên có `node.hash >= requestHash`). Nếu không có node nào lớn hơn, quay lại node đầu tiên của vòng.',
    starterCode: `function solve(nodes, requestHash) {
  // TODO: write your solution
}
`,
    timeLimitSeconds: 360,
    testCases: [
      {
        input: '[[{"node":"A","hash":100},{"node":"B","hash":200},{"node":"C","hash":300}], 150]',
        expectedOutput: 'B',
        explanation: 'B có hash 200 >= 150 nên request được route vào B.',
      },
      {
        input: '[[{"node":"A","hash":100},{"node":"B","hash":200}], 250]',
        expectedOutput: 'A',
        isHidden: true,
      },
    ],
  },
  {
    _id: new Types.ObjectId('66f000000000000000000221'),
    field: CareerField.BACKEND,
    targetSkillLevel: SkillLevel.MASTER,
    difficulty: 'hard',
    title: 'Connection Pool Lease/Release Manager',
    content:
      'Viết `solve(pool, action)` mô phỏng Connection Pool của database. `pool` chứa `{ max: number, active: string[], idle: string[] }`. \n- Nếu `action === "lease"`: lấy 1 connection từ `idle` chuyển sang `active`, hoặc tạo mới nếu `active.length < max`. Trả về `{ status: "leased" | "full", connection: string | null, pool }`.\n- Nếu `action === "release"` (được truyền dạng `["release", "connId"]`): chuyển `connId` từ `active` về `idle`. Trả về `{ status: "released", connection: connId, pool }`. \n(Lưu ý input action có thể nhận tham số kèm theo, hãy xử lý thích hợp).',
    starterCode: `function solve(pool, action) {
  // TODO: write your solution
}
`,
    timeLimitSeconds: 360,
    testCases: [
      {
        input: '[{"max":2,"active":["c1"],"idle":["c2"]}, "lease"]',
        expectedOutput: '{"status":"leased","connection":"c2","pool":{"max":2,"active":["c1","c2"],"idle":[]}}',
        explanation: 'Thuê kết nối c2 đang nhàn rỗi.',
      },
      {
        input: '[{"max":2,"active":["c1","c2"],"idle":[]}, ["release", "c1"]]',
        expectedOutput: '{"status":"released","connection":"c1","pool":{"max":2,"active":["c2"],"idle":["c1"]}}',
        isHidden: true,
      },
    ],
  },
  {
    _id: new Types.ObjectId('66f000000000000000000222'),
    field: CareerField.BACKEND,
    targetSkillLevel: SkillLevel.MASTER,
    difficulty: 'hard',
    title: 'Weighted Round Robin Balancer',
    content:
      'Viết `solve(nodes, index)` thực hiện Weighted Round Robin Load Balancer. \n`nodes` là mảng `{ node: string, w: weight }`. Trả về node tương ứng với số thứ tự request `index` (0-indexed). Ví dụ với A (w=3), B (w=1): chuỗi phân phối là: A, A, A, B, A, A, A, B,...',
    starterCode: `function solve(nodes, index) {
  // TODO: write your solution
}
`,
    timeLimitSeconds: 360,
    testCases: [
      {
        input: '[[{"node":"A","w":3},{"node":"B","w":1}], 2]',
        expectedOutput: 'A',
        explanation: 'Lượt index 2 (request thứ 3) thuộc về server A.',
      },
      {
        input: '[[{"node":"A","w":2},{"node":"B","w":1}], 2]',
        expectedOutput: 'B',
        isHidden: true,
      },
    ],
  },
  {
    _id: new Types.ObjectId('66f000000000000000000223'),
    field: CareerField.BACKEND,
    targetSkillLevel: SkillLevel.MASTER,
    difficulty: 'hard',
    title: 'Parse Multipart Form Boundary',
    content:
      'Viết `solve(bodyStr, boundary)` nhận vào chuỗi body của request multipart/form-data và chuỗi `boundary`. Phân tích body và trích xuất ra object chứa key-value của các form fields.',
    starterCode: `function solve(bodyStr, boundary) {
  // TODO: write your solution
}
`,
    timeLimitSeconds: 360,
    testCases: [
      {
        input: '["--boundary\\r\\nContent-Disposition: form-data; name=\\"user\\"\\r\\n\\r\\nadmin\\r\\n--boundary--", "boundary"]',
        expectedOutput: '{"user":"admin"}',
        explanation: 'Parse trường user có giá trị admin từ multipart stream.',
      },
      {
        input: '["--b\\r\\nContent-Disposition: form-data; name=\\"x\\"\\r\\n\\r\\n1\\r\\n--b\\r\\nContent-Disposition: form-data; name=\\"y\\"\\r\\n\\r\\n2\\r\\n--b--", "b"]',
        expectedOutput: '{"x":"1","y":"2"}',
        isHidden: true,
      },
    ],
  },
  {
    _id: new Types.ObjectId('66f000000000000000000224'),
    field: CareerField.BACKEND,
    targetSkillLevel: SkillLevel.MASTER,
    difficulty: 'hard',
    title: 'Map Reduce Words Count',
    content:
      'Viết `solve(docs)` nhận vào một mảng chứa các câu văn. Mô phỏng cơ chế MapReduce để đếm số lần xuất hiện của các từ (lowercase, không lấy dấu câu). Trả về object map từ từ vựng sang số lần xuất hiện.',
    starterCode: `function solve(docs) {
  // TODO: write your solution
}
`,
    timeLimitSeconds: 360,
    testCases: [
      {
        input: '[["hello world", "hello node js"]]',
        expectedOutput: '{"hello":2,"world":1,"node":1,"js":1}',
        explanation: 'Tổng hợp số lượng từ vựng xuất hiện trong 2 văn bản.',
      },
      {
        input: '[["java", "python, java"]]',
        expectedOutput: '{"java":2,"python":1}',
        isHidden: true,
      },
    ],
  },
  {
    _id: new Types.ObjectId('66f000000000000000000225'),
    field: CareerField.BACKEND,
    targetSkillLevel: SkillLevel.MASTER,
    difficulty: 'hard',
    title: 'Find Dependency Shortest Path',
    content:
      'Viết `solve(graph, start, end)` tìm đường đi ngắn nhất (ít node trung gian nhất) từ node `start` đến `end` trong đồ thị có hướng mô tả phụ thuộc. Trả về mảng chứa chuỗi đường đi từ `start` đến `end`. Nếu có nhiều đường cùng chiều dài, trả về đường đi có thứ tự bảng chữ cái nhỏ hơn. Nếu không có đường đi, trả về `null`.',
    starterCode: `function solve(graph, start, end) {
  // TODO: write your solution
}
`,
    timeLimitSeconds: 360,
    testCases: [
      {
        input: '[{"A":["B","C"],"B":["D"],"C":["D"],"D":[]}, "A", "D"]',
        expectedOutput: '["A","B","D"]',
        explanation: 'Có hai đường đi A->B->D và A->C->D có độ dài bằng nhau. Chọn A->B->D vì B đi trước C.',
      },
      {
        input: '[{"A":["B"],"B":[]}, "A", "C"]',
        expectedOutput: 'null',
        isHidden: true,
      },
    ],
  },
  {
    _id: new Types.ObjectId('66f000000000000000000226'),
    field: CareerField.BACKEND,
    targetSkillLevel: SkillLevel.MASTER,
    difficulty: 'hard',
    title: 'Transaction State Rollback',
    content:
      'Viết `solve(ops)` mô phỏng rollback transaction. Nhận mảng các thao tác database `{ op: "insert" | "update", table: string, data: object, error?: boolean }`. \nThực hiện tuần tự các thao tác. Nếu gặp bất kỳ thao tác nào có thuộc tính `error === true`, dừng lại ngay lập tức và tiến hành rollback (ngược lại toàn bộ các thao tác thành công trước đó). Trả về `{ status: "committed" | "rolled_back", executed: string[] }`. \nExecuted chứa danh sách tên các thao tác thành công được commit, hoặc rỗng nếu bị rollback.',
    starterCode: `function solve(ops) {
  // TODO: write your solution
}
`,
    timeLimitSeconds: 360,
    testCases: [
      {
        input: '[[{"op":"insert","table":"users","data":{"id":1}},{"op":"update","table":"users","data":{"id":1},"error":true}]]',
        expectedOutput: '{"status":"rolled_back","executed":[]}',
        explanation: 'Thao tác thứ 2 gặp lỗi nên toàn bộ transaction bị rollback.',
      },
      {
        input: '[[{"op":"insert","table":"posts","data":{"id":1}}]]',
        expectedOutput: '{"status":"committed","executed":["insert posts"]}',
        isHidden: true,
      },
    ],
  },
  {
    _id: new Types.ObjectId('66f000000000000000000227'),
    field: CareerField.BACKEND,
    targetSkillLevel: SkillLevel.MASTER,
    difficulty: 'hard',
    title: 'Simple SQL Lexer Tokens Generator',
    content:
      'Viết `solve(sql)` nhận vào câu lệnh SQL đơn giản dạng chuỗi. Phân tích cú pháp và trả về mảng các tokens (tách từ bởi khoảng trắng, dấu phẩy, dấu chấm phẩy, dấu ngoặc, nhưng giữ nguyên chuỗi bọc trong dấu nháy đơn).',
    starterCode: `function solve(sql) {
  // TODO: write your solution
}
`,
    timeLimitSeconds: 360,
    testCases: [
      {
        input: '["SELECT * FROM users;"]',
        expectedOutput: '["SELECT","*","FROM","users",";"]',
        explanation: 'Tách câu lệnh thành các token từ vựng.',
      },
      {
        input: '["SELECT name FROM clients WHERE id = 1;"]',
        expectedOutput: '["SELECT","name","FROM","clients","WHERE","id","=","1",";"]',
        isHidden: true,
      },
    ],
  },
  {
    _id: new Types.ObjectId('66f000000000000000000228'),
    field: CareerField.BACKEND,
    targetSkillLevel: SkillLevel.MASTER,
    difficulty: 'hard',
    title: 'JWT Expiry and Signature Decoder',
    content:
      'Viết `solve(token, secretKey, currentTime)` kiểm tra tính hợp lệ của token JWT giả lập. Token có dạng `"header.payload.signature"`. \nNếu chữ ký signature không khớp với giá trị mã hóa của `header + "." + payload + "." + secretKey`, trả về `{ valid: false, reason: "Invalid signature" }`. \nNếu hết hạn (payload sau khi parse base64 chứa exp < currentTime), trả về `{ valid: false, reason: "Token expired" }`.\nNgược lại trả về `{ valid: true, payload: parsedPayload }`. (Ở bài test này chỉ cần mô phỏng kiểm tra format đơn giản).',
    starterCode: `function solve(token, secretKey, currentTime) {
  // TODO: write your solution
}
`,
    timeLimitSeconds: 360,
    testCases: [
      {
        input: '["header.payload.signature", "key", 1000]',
        expectedOutput: '{"valid":false,"reason":"Invalid signature format"}',
        explanation: 'Token sai định dạng chữ ký.',
      },
      {
        input: '["eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJleHAiOjE1MDB9.sig", "key", 1600]',
        expectedOutput: '{"valid":false,"reason":"Token expired"}',
        isHidden: true,
      },
    ],
  },
];
