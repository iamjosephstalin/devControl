import { Client } from 'ssh2'

export interface SSHConfig {
  host: string
  port: number
  username: string
  password?: string
  privateKey?: string
}

export async function executeSSHCommand(
  config: SSHConfig,
  command: string
): Promise<{ stdout: string; stderr: string; code: number | null }> {
  return new Promise((resolve, reject) => {
    const conn = new Client()
    
    conn.on('ready', () => {
      conn.exec(command, (err, stream) => {
        if (err) {
          conn.end()
          reject(err)
          return
        }

        let stdout = ''
        let stderr = ''

        stream.on('close', (code: number | null) => {
          conn.end()
          resolve({ stdout, stderr, code })
        })

        stream.on('data', (data: Buffer) => {
          stdout += data.toString()
        })

        stream.stderr.on('data', (data: Buffer) => {
          stderr += data.toString()
        })
      })
    })

    conn.on('error', (err) => {
      reject(err)
    })

    const connectOptions: any = {
      host: config.host,
      port: config.port,
      username: config.username,
      readyTimeout: 10000, // 10 second timeout
      keepaliveInterval: 10000,
      keepaliveCountMax: 3,
    }

    if (config.password) {
      // Password is already decrypted when passed from API route
      connectOptions.password = config.password
    } else if (config.privateKey) {
      connectOptions.privateKey = config.privateKey
    } else {
      // If neither password nor key is provided, reject
      reject(new Error("No authentication method provided (password or private key required)"))
      return
    }

    // Set connection timeout
    const timeout = setTimeout(() => {
      conn.end()
      reject(new Error("Connection timeout"))
    }, 15000) // 15 second overall timeout

    conn.on('ready', () => {
      clearTimeout(timeout)
    })

    conn.connect(connectOptions)
  })
}

