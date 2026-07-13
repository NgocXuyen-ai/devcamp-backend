import type { GenerateQuestionInput } from '../interfaces/question-generator.interface';

export function buildGenerateQuestionPrompt(
  input: GenerateQuestionInput,
): string {
  const { field, difficulty, questionType, count } = input;

  const typeInstructions: Record<string, string> = {
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
- Each test case MUST include an "explanation" field that briefly explains why the expected output is correct.

EXAMPLE (single parameter):
{
  "title": "Sum of Even Numbers",
  "content": "Write a function sumEven(arr) that returns the sum of all even numbers in the array.\\n\\nExample:\\nsumEven([1,2,3,4]) → 6",
  "correctAnswer": "function sumEven(arr) { return arr.filter(n => n % 2 === 0).reduce((a, b) => a + b, 0); }",
  "explanation": "Filter even numbers then reduce to sum.",
  "category": "Array Methods",
  "starterCode": "function sumEven(arr) {\\n  // your code here\\n}",
  "testCases": [
      { "input": "[1,2,3,4]", "expectedOutput": "6", "explanation": "Even numbers are 2 and 4. 2 + 4 = 6." },
      { "input": "[1,3,5]", "expectedOutput": "0", "explanation": "No even numbers in array, sum is 0." },
      { "input": "[]", "expectedOutput": "0", "explanation": "Empty array, sum is 0." }
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
      { "input": "[\\"ha\\", 3]", "expectedOutput": "hahaha", "explanation": "'ha' repeated 3 times is 'hahaha'." },
      { "input": "[\\"abc\\", 2]", "expectedOutput": "abcabc", "explanation": "'abc' repeated 2 times is 'abcabc'." },
      { "input": "[\\"x\\", 0]", "expectedOutput": "", "explanation": "Repeating 0 times returns empty string." }
    ]
}`,
  };

  return `You are a coding question generator for a competitive battle platform.
Players type their answer manually, so correctAnswer MUST be short and exact.

Generate exactly ${count} ${difficulty} questions about ${field} programming.

${typeInstructions[questionType]}

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
    "starterCode": "function signature",
    "testCases": "[{ input, expectedOutput }]"
  }
]`;
}
