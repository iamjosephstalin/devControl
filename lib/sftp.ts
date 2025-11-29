import { Client } from 'ssh2'
import { SSHConfig } from './ssh'

export interface SFTPFile {
  filename: string
  longname: string
  attrs: {
    size: number
    uid: number
    gid: number
    mode: number
    atime: number
    mtime: number
  }
  type: 'd' | '-' | 'l' // directory, file, symlink
}

export async function listSFTPDirectory(
  config: SSHConfig,
  path: string
): Promise<SFTPFile[]> {
  return new Promise((resolve, reject) => {
    const conn = new Client()
    
    conn.on('ready', () => {
      conn.sftp((err, sftp) => {
        if (err) {
          conn.end()
          reject(err)
          return
        }

        sftp.readdir(path, (err, list) => {
          conn.end()
          if (err) {
            reject(err)
            return
          }
          // ssh2 readdir returns items with filename, longname, and attrs
          // attrs has isDirectory, isFile, isSymbolicLink, etc.
          const files = (list || []).map((item: any) => {
            const attrs = item.attrs || {}
            let type: 'd' | '-' | 'l' = '-'
            if (attrs.isDirectory) type = 'd'
            else if (attrs.isSymbolicLink) type = 'l'
            
            return {
              filename: item.filename,
              longname: item.longname || '',
              attrs: {
                size: attrs.size || 0,
                uid: attrs.uid || 0,
                gid: attrs.gid || 0,
                mode: attrs.mode || 0,
                atime: attrs.atime || 0,
                mtime: attrs.mtime || 0,
              },
              type,
            }
          })
          resolve(files)
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
      conn.end()
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

export async function readSFTPFile(
  config: SSHConfig,
  remotePath: string
): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const conn = new Client()
    
    conn.on('ready', () => {
      conn.sftp((err, sftp) => {
        if (err) {
          conn.end()
          reject(err)
          return
        }

        sftp.readFile(remotePath, (err, data) => {
          conn.end()
          if (err) {
            reject(err)
            return
          }
          resolve(data)
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
      conn.end()
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

export async function writeSFTPFile(
  config: SSHConfig,
  remotePath: string,
  data: Buffer
): Promise<void> {
  return new Promise((resolve, reject) => {
    const conn = new Client()
    
    conn.on('ready', () => {
      conn.sftp((err, sftp) => {
        if (err) {
          conn.end()
          reject(err)
          return
        }

        sftp.writeFile(remotePath, data, (err) => {
          conn.end()
          if (err) {
            reject(err)
            return
          }
          resolve()
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
      conn.end()
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

export async function deleteSFTPFile(
  config: SSHConfig,
  remotePath: string
): Promise<void> {
  return new Promise((resolve, reject) => {
    const conn = new Client()
    
    conn.on('ready', () => {
      conn.sftp((err, sftp) => {
        if (err) {
          conn.end()
          reject(err)
          return
        }

        sftp.unlink(remotePath, (err) => {
          conn.end()
          if (err) {
            reject(err)
            return
          }
          resolve()
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
      conn.end()
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

export async function createSFTPDirectory(
  config: SSHConfig,
  remotePath: string
): Promise<void> {
  return new Promise((resolve, reject) => {
    const conn = new Client()
    
    conn.on('ready', () => {
      conn.sftp((err, sftp) => {
        if (err) {
          conn.end()
          reject(err)
          return
        }

        sftp.mkdir(remotePath, (err) => {
          conn.end()
          if (err) {
            reject(err)
            return
          }
          resolve()
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
      conn.end()
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

