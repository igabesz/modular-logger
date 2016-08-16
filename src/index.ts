/** Note on publish & build: This line must be in the exported .d.ts file to make it work... */
///<reference path="../includes"/>
import * as winston from 'winston';
import * as _ from 'lodash';
import * as moment from 'moment';
import * as colors from 'colors/safe';
import { Summarizer, SummarizerOptions } from './summarizer';


//------------------------------------------------------------------------------
// Definitions

export type LogLevels = 'fatal' | 'error' | 'warn' | 'success' | 'info' | 'debug' | 'trace';
export const levels = { fatal: 0, error: 1, warn: 2, success: 3, info: 4, debug: 5, trace: 6 };

//------------------------------------------------------------------------------
// Internal helpers

const levelColors = { fatal: 'bgRed', error: 'red', warn: 'yellow', success: 'bgGreen', info: 'cyan', debug: 'blue', trace: 'blue' };

function createFormatter(useColors?: boolean) {
	return (options: any) => {
		//console.log(options);
		let atStr = moment(options.meta.at).format('YYYY-MM-DD HH:mm:ss');
		useColors && (atStr = colors.gray(atStr));
		let levelStr = options.level.toUpperCase();
		useColors && (levelStr = colors[levelColors[options.level]](levelStr));
		let pureMeta = _.omit(options.meta, ['at', 'module']);
		let dataStr = '';
		if (options.meta.params) {
			dataStr = '\t' + JSON.stringify(options.meta.params);
			useColors && (dataStr = colors.gray(dataStr));
		}
		return `[${atStr}] ${levelStr} ${options.meta.module}: ${options.message}` + dataStr;
	};
};

//------------------------------------------------------------------------------
// Transport layers

let transports: winston.TransportInstance[] = [];
let summarizer: Summarizer = null;

/** extends winston.ConsoleTransportOptions */
export interface ConsoleLoggerOptions  {
	level?: string;
	formatter?: Function;
}

export function setupConsoleLogger(options?: ConsoleLoggerOptions) {
	options = options || {};
	options.formatter = createFormatter(true);
	transports.push(new winston.transports.Console(options));
}

/** extends winston.FileTransportOptions */
export interface FileLoggerOptions  {
	filename?: string;
	dirname?: string;
	stream?: any;
	tailable?: boolean;
	json?: boolean;
	formatter?: Function;
	level?: string;
}

export function setupFileLogger(options?: FileLoggerOptions) {
	options = options || {};
	options.formatter = createFormatter();
	options.json = false;
	transports.push(new winston.transports.File(options));
}

export function setupSummarizer(options?: SummarizerOptions) {
	options = options || {};
	summarizer = new Summarizer(options);
	transports.push(summarizer);
}

export function sumLog() { return summarizer ? summarizer.cnt : {}; }
export function canContinue() { return summarizer ? summarizer.canContinue() : true; }
export function tryContinue() { return summarizer && summarizer.tryContinue(); }

//------------------------------------------------------------------------------
// Logger instances

export function createLogger(module: string): Logger { return new LoggerImplementation(module); }

export interface Logger {
	module: string;
	fatal(msg: string, params?: any): Logger;
	error(msg: string, params?: any): Logger;
	warn(msg: string, params?: any): Logger;
	success(msg: string, params?: any): Logger;
	info(msg: string, params?: any): Logger;
	debug(msg: string, params?: any): Logger;
	trace(msg: string, params?: any): Logger;
	log(level: LogLevels, msg: string, params?: any): Logger;
}

class LoggerImplementation implements Logger {
	private logger: any;

	constructor(public module: string) {
		this.logger = new winston.Logger(<any>{
			levels,
			transports,
		});
	}

	private getMeta(params?: any) {
		return {
			at: Date.now(),
			module: this.module,
			params
		};
	}

	fatal(msg: string, params?: any): Logger { this.logger.log('fatal', msg, this.getMeta(params)); return this; };
	error(msg: string, params?: any): Logger { this.logger.log('error', msg, this.getMeta(params)); return this; };
	warn(msg: string, params?: any): Logger { this.logger.log('warn', msg, this.getMeta(params)); return this; };
	success(msg: string, params?: any): Logger { this.logger.log('success', msg, this.getMeta(params)); return this; };
	info(msg: string, params?: any): Logger { this.logger.log('info', msg, this.getMeta(params)); return this; };
	debug(msg: string, params?: any): Logger { this.logger.log('debug', msg, this.getMeta(params)); return this; };
	trace(msg: string, params?: any): Logger { this.logger.log('trace', msg, this.getMeta(params)); return this; };
	log(level: LogLevels, msg: string, params?: any): Logger { this.logger.log(level, msg, this.getMeta(params)); return this; };
}
