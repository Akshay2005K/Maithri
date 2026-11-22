// Official Cashfree Sandbox Test Data
// Source: https://www.cashfree.com/docs/payments/online/resources/sandbox-test-data

export const CASHFREE_TEST_DATA = {
  sourceLabel: "Cashfree Sandbox Test Data docs",
  card: {
    visaNumber: "4706131211212123",
    expiry: "03/2028",
    cvv: "123",
    name: "Test",
    otp: "111000",
  },
  upi: {
    successVpa: "testsuccess@gocash",
    failedVpa: "invalid@upi",
  },
} as const;
