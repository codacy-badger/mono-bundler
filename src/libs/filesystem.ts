import * as path from 'path'
import fs from 'fs-extra'
import { outputFileSync } from 'fs-extra'

class FileSystem {
    static concat(filename: string, str: string) {
        if (str.length === 0) {
            return filename
        }

        const outputExtension = path.extname(filename)
        return filename.replace(outputExtension, `.${str}${outputExtension}`)
    }

    static dirname = file => path.dirname(file)

    static copySync = (src, dest, opts?: any) => fs.copySync (src, dest, opts)

    static existsSync = file => fs.existsSync(file)

    static join = (...paths: string[]) => path.join(...paths)

    static outputFileSync = (dest: string, content: string) => outputFileSync(dest, content)

    static resolve = (...pathSegments: string[]) => path.resolve(...pathSegments)
}

const fileSystem = FileSystem

export default fileSystem
