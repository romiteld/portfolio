import * as React from 'react';

/**
 * `VideoComponent` currently does not accept any props. Using a type alias
 * makes this explicit without relying on an empty interface.
 */
export type VideoComponentProps = Record<string, never>;

declare const VideoComponent: React.FC<VideoComponentProps>;

export default VideoComponent;
