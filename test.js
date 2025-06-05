// Create a file called test-env.js
console.log('All env vars:', Object.keys(process.env).filter(key => key.includes('DATABASE')))
console.log('DATABASE_URL:', process.env.DATABASE_URL)
console.log('NODE_ENV:', process.env.NODE_ENV)
console.log('Current directory:', process.cwd())
