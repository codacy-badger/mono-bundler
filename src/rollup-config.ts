import { OutputOptions, RollupOptions } from 'rollup'
import { Config } from './types/config'
import fileSystem from './filesystem'
import Workspace from './workspace'
import Package from './package'
import Plugins from './plugins'
import Logger from './logger'
import Loader from './loader'

/**
 * @todo rename class
 */
export default class RollupConfig {

    private modifiedPackages: { [name: string]: Package } = {}
    private rollupConfig: RollupOptions[] = []
    private plugins = new Plugins(this.config)
    private workspace = new Workspace(this.config)
    private log = new Logger(this.config.silent)
    private args = require('minimist')(process.argv.slice(2))

    constructor(private readonly config: Config.BuildOptions) {
    }

    async create(): Promise<RollupOptions[]> {

        await Promise.all(this.workspace.packages.map(async pkg => pkg.main && await this.addRollupConfig(pkg)))

        if (!this.rollupConfig.length) {
            this.log.success('All package bundles are present and up-to-date. Nothing to do.')
        }

        this.showModifiedPackages()

        this.generateLoaders()

        return this.rollupConfig.length ? this.rollupConfig : process.exit(0)
    }

    private get option() {
        return { ...this.config, ...this.args }
    }

    /**
     *
     * @private
     * @param {Package} pkg - Package
     * @returns void
     */
    private addRollupConfig = async (pkg: Package): Promise<void[]> => Promise.all(this.targets.map(async target => {

        const output = await pkg.output(target, this.option.watch)
        const { input } = pkg

        if (!input || this.bundleShouldBeSkipped(output, target)) {
            return
        }

        pkg.bundles.push({ file: output.file, target })

        this.modifiedPackages[pkg.name] = pkg

        this.rollupConfig.push({
            input,
            output,
            external: id => id.includes('core-js'), // todo merge with this.config
            plugins: this.plugins.get(target),
        })
    }))

    /**
     *
     * @private
     * @returns void
     */
    private generateLoaders(): void {
        this.option.createLoaders && Object.entries(this.modifiedPackages)
            .map(async ([_, { distDir, bundles, hash }]) =>
                new Loader(bundles).output(distDir, await hash.get()))
    }

    /**
     *
     * @private
     * @returns void
     */
    private showModifiedPackages() {
        const modifiedPackages = Object.keys(this.modifiedPackages)
        modifiedPackages.length && this.log.info('Modified packages:')
        modifiedPackages.map(name => this.log.yellow(`- ${name}`))
    }

    private get targets() {
        return this.option?.legacySupport ? [Config.Target.default, Config.Target.legacy] : [Config.Target.default]
    }

    /**
     *
     * @param {OutputOptions} output
     * @param {string} target
     * @returns void
     */
    private bundleShouldBeSkipped = (output: OutputOptions, target: string): boolean =>
        this.option?.watch && target === Config.Target.legacy || !this.option?.watch && fileSystem.existsSync(output.file)
}
