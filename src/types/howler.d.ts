declare module 'howler' {
  export class Howl {
    constructor(options: {
      src: string[];
      loop?: boolean;
      volume?: number;
      html5?: boolean;
      onend?: () => void;
      onloaderror?: () => void;
    });
    play(): number;
    pause(): void;
    stop(): void;
    unload(): void;
    playing(): boolean;
    volume(vol?: number): number | this;
    mute(muted?: boolean): boolean | this;
    fade(from: number, to: number, duration: number): void;
    on(event: string, callback: () => void): this;
    off(event: string): this;
  }
}
