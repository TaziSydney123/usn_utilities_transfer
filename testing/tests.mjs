import helpers from '../helpers.js';

function testFunction(testableFunction, testValues) {
  let fails = [];

  for (const testValue of testValues) {
    const param = testValue.param;
    const expected = testValue.expected;

    const result = testableFunction(param);
    if (result != expected)
      fails.push({ param: param, result: result, expected: expected });
  }
  
  return fails;
}

const tests = [
  { function: helpers.getTimestampFromHammertime, testValues: [
    { param: "<t:1681935060:t>", expected: "1681935060000" }, 
    { param: "1681935060", expected: "1681935060000"},
    { param: "<t:1681935060:f>", expected: "1681935060000"},
  ]}
]

function runTests(tests) {
  let testFails = {};
  for (const test of tests) {
    const testableFunction = test.function;
    const testValues = test.testValues;
    
    const failedParameters = testFunction(testableFunction, testValues);
    if (failedParameters.length >= 1)
      testFails[testableFunction.name] = failedParameters;
  }
  
  return testFails;
}

const result = runTests(helpersTests);
console.dir(result, {depth:3});