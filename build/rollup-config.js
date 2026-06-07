// Config file for running Rollup in "normal" mode (non-watch)

import rollUpGitVersion from 'rollup-plugin-git-version';
import json from 'rollup-plugin-json';
import gitRev from 'git-rev-sync';
import typescript from '@rollup/plugin-typescript';
import commonjs from '@rollup/plugin-commonjs';

let version = require('../package.json').version;
let release;

// Skip the git branch+rev in the banner when doing a release build
if (process.env.NODE_ENV === 'release') {
	release = true;
} else {
	release = false;
	const branch = gitRev.branch();
	const rev = gitRev.short();
	version += '+' + branch + '.' + rev;
}

export default {
	format: 'umd',
	moduleName: 'L.Wrapped',
	entry: 'src/Leaflet.Antimeridian.ts', // Updated pointer
	dest: 'dist/leaflet.antimeridian-src.js',
	plugins: [
		commonjs(),
		typescript({
			tsconfig: './tsconfig.json',
			declaration: true,
			sourceMap: true
		}),
		release ? json() : rollUpGitVersion(),
	],
	sourceMap: true,
	legacy: true // Needed to create files loadable by IE8
};
