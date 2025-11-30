/**
 * Generates a strong password with customizable options
 */
export function generatePassword(options?: {
  length?: number
  includeUppercase?: boolean
  includeLowercase?: boolean
  includeNumbers?: boolean
  includeSymbols?: boolean
}): string {
  const {
    length = 12,
    includeUppercase = true,
    includeLowercase = true,
    includeNumbers = true,
    includeSymbols = true,
  } = options || {}

  const uppercase = "ABCDEFGHIJKLMNOPQRSTUVWXYZ"
  const lowercase = "abcdefghijklmnopqrstuvwxyz"
  const numbers = "0123456789"
  const symbols = "!@#$%^&*()_+-=[]{}|;:,.<>?"

  let charset = ""
  if (includeLowercase) charset += lowercase
  if (includeUppercase) charset += uppercase
  if (includeNumbers) charset += numbers
  if (includeSymbols) charset += symbols

  if (charset.length === 0) {
    throw new Error("At least one character type must be enabled")
  }

  let password = ""
  const charsetArray = charset.split("")

  // Ensure at least one character from each selected type
  if (includeLowercase) {
    password += lowercase[Math.floor(Math.random() * lowercase.length)]
  }
  if (includeUppercase) {
    password += uppercase[Math.floor(Math.random() * uppercase.length)]
  }
  if (includeNumbers) {
    password += numbers[Math.floor(Math.random() * numbers.length)]
  }
  if (includeSymbols) {
    password += symbols[Math.floor(Math.random() * symbols.length)]
  }

  // Fill the rest randomly
  for (let i = password.length; i < length; i++) {
    password += charsetArray[Math.floor(Math.random() * charsetArray.length)]
  }

  // Shuffle the password
  return password
    .split("")
    .sort(() => Math.random() - 0.5)
    .join("")
}

/**
 * Generates an 8-digit numeric password (for simpler use cases)
 */
export function generateNumericPassword(length: number = 8): string {
  const numbers = "0123456789"
  let password = ""
  for (let i = 0; i < length; i++) {
    password += numbers[Math.floor(Math.random() * numbers.length)]
  }
  return password
}

/**
 * Generates a strong 8-character password (default for user creation)
 */
export function generateStrongPassword(length: number = 8): string {
  return generatePassword({
    length,
    includeUppercase: true,
    includeLowercase: true,
    includeNumbers: true,
    includeSymbols: true,
  })
}

/**
 * Generates a secure password for vault/security purposes (12-16 characters)
 */
export function generateSecurePassword(length: number = 16): string {
  return generatePassword({
    length,
    includeUppercase: true,
    includeLowercase: true,
    includeNumbers: true,
    includeSymbols: true,
  })
}

