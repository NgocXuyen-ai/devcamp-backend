import type { GenerateQuestionInput } from '../interfaces/question-generator.interface';

export function buildGenerateQuestionPrompt(
  input: GenerateQuestionInput,
): string {
  const { field, difficulty, questionType, count } = input;

  const typeInstructions: Record<string, string> = {
    output_prediction: `
Create "What is the output?" questions.
- Provide a short code snippet (5-15 lines) that produces a SPECIFIC, DETERMINISTIC output.
- Do NOT use Math.random(), Date.now(), or anything non-deterministic.
- correctAnswer must be the EXACT raw output value, NOT wrapped in quotes or console.log().
- If output is undefined, correctAnswer is: undefined
- If output is a string "hello", correctAnswer is: hello
- If output is a number 42, correctAnswer is: 42
- If output is an array [1,2,3], correctAnswer is: 1,2,3
- If output is NaN, correctAnswer is: NaN
- Keep correctAnswer SHORT (under 30 characters).

EXAMPLE:
{
  "title": "Array destructuring default",
  "content": "What is the output?\\n\\nconst [a = 5, b = 7] = [1];\\nconsole.log(a + b);",
  "correctAnswer": "8",
  "explanation": "a is 1 (from array), b is 7 (default value). 1 + 7 = 8.",
  "category": "Destructuring"
}`,

    fill_blank: `
Create "Fill in the blank" questions.
- Provide a code snippet with exactly ONE blank marked as _____.
- The blank has ONLY ONE valid answer.
- correctAnswer must be the EXACT keyword, method name, or value that fills the blank.
- Keep correctAnswer to 1-2 words maximum.

EXAMPLE:
{
  "title": "Array iteration method",
  "content": "Fill in the blank:\\n\\nconst doubled = [1,2,3]._____(x => x * 2);\\nconsole.log(doubled); // [2,4,6]",
  "correctAnswer": "map",
  "explanation": "Array.map() creates a new array by applying the callback to each element.",
  "category": "Array Methods"
}`,

    coding_challenge: `
Create coding challenge questions where the player writes a complete function.
- Describe the problem clearly with input/output specification.
- Provide 3-5 test cases with input and expectedOutput.
- Provide starter code (function signature only) in starterCode field.
- Provide a working solution in correctAnswer field.
- For easy: simple loops, conditions (5-10 lines solution).
- For medium: arrays, strings, recursion (10-20 lines solution).
- For hard: dynamic programming, complex algorithms (20-40 lines solution).

CRITICAL — testCases input format:
- input MUST be a valid JSON string that can be parsed by JSON.parse().
- Single parameter: input is the JSON value directly.
  e.g. function sumEven(arr) → input: "[1,2,3,4]"
  e.g. function factorial(n) → input: "5"
  e.g. function reverseString(str) → input: "\\"hello\\""
- Multiple parameters: input is a JSON array of all arguments.
  e.g. function add(a, b) → input: "[1, 2]"
  e.g. function repeat(str, n) → input: "[\\"hello\\", 3]"
  e.g. function clamp(val, min, max) → input: "[15, 0, 10]"
- expectedOutput is ALWAYS a plain string of the return value (no quotes around strings).
  e.g. return "hello" → expectedOutput: "hello"
  e.g. return 42 → expectedOutput: "42"
  e.g. return [1,2] → expectedOutput: "1,2"

EXAMPLE (single parameter):
{
  "title": "Sum of Even Numbers",
  "content": "Write a function sumEven(arr) that returns the sum of all even numbers in the array.\\n\\nExample:\\nsumEven([1,2,3,4]) → 6",
  "correctAnswer": "function sumEven(arr) { return arr.filter(n => n % 2 === 0).reduce((a, b) => a + b, 0); }",
  "explanation": "Filter even numbers then reduce to sum.",
  "category": "Array Methods",
  "starterCode": "function sumEven(arr) {\\n  // your code here\\n}",
  "testCases": [
    { "input": "[1,2,3,4]", "expectedOutput": "6" },
    { "input": "[1,3,5]", "expectedOutput": "0" },
    { "input": "[]", "expectedOutput": "0" }
  ]
}

EXAMPLE (multiple parameters):
{
  "title": "Repeat String",
  "content": "Write a function repeatStr(str, n) that returns the string repeated n times.\\n\\nExample:\\nrepeatStr('ha', 3) → 'hahaha'",
  "correctAnswer": "function repeatStr(str, n) { return str.repeat(n); }",
  "explanation": "Use String.repeat() to repeat the string n times.",
  "category": "String Methods",
  "starterCode": "function repeatStr(str, n) {\\n  // your code here\\n}",
  "testCases": [
    { "input": "[\\"ha\\", 3]", "expectedOutput": "hahaha" },
    { "input": "[\\"abc\\", 2]", "expectedOutput": "abcabc" },
    { "input": "[\\"x\\", 0]", "expectedOutput": "" }
  ]
}`,
  };

  return `You are a coding question generator for a competitive battle platform.
Players type their answer manually, so correctAnswer MUST be short and exact.

Generate exactly ${count} ${difficulty} questions about ${field} programming.

${typeInstructions[questionType] ?? typeInstructions.output_prediction}

STRICT RULES:
1. Each question must be independent.
2. Code must be syntactically valid and runnable.
3. correctAnswer must be case-sensitive, no trailing spaces.
4. Do NOT wrap correctAnswer in quotes, backticks, or console.log().
5. category must be a specific topic (e.g. "Closures", "React Hooks", "Promises").
6. Difficulty: easy = basic syntax, medium = tricky edge cases, hard = advanced patterns.
7. content should include the code snippet directly, not as a separate field.

Respond with ONLY a valid JSON array. No markdown fences, no explanation outside JSON:
[
  {
    "title": "Short descriptive title",
    "content": "Full question text with code snippet",
    "correctAnswer": "exact short answer or solution code",
    "explanation": "Why this is the answer",
    "category": "Specific Topic",
    "starterCode": "(coding_challenge only) function signature",
    "testCases": "(coding_challenge only) [{ input, expectedOutput }]"
  }
]`;
}
