declare module 'node:worker_threads' {
  export const workerData: unknown;
  export const parentPort: { postMessage(value: unknown): void } | null;
  export class Worker {
    constructor(filename: URL, options?: { workerData?: unknown });
    once(event: 'message', listener: (value: unknown) => void): this;
    once(event: 'error', listener: (error: Error) => void): this;
    once(event: 'exit', listener: (code: number) => void): this;
    terminate(): Promise<number>;
  }
}
declare module 'node:fs' {
  export function writeFileSync(path: string, data: string, encoding?: string): void;
  export function readFileSync(path: string, encoding: string): string;
}
declare const process: {
  argv: string[];
  exitCode?: number;
  stdout: { write(value: string): void };
  stderr: { write(value: string): void };
};
