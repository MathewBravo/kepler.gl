// SPDX-License-Identifier: MIT
// Copyright contributors to the kepler.gl project

/**
 * Copied from https://github.com/sarink/react-file-drop
 * For React 16.8 compatibility
 */
import React, {ReactNode} from 'react';
import Window from 'global/window';

export type FileDropProps = {
  dropEffect?: 'copy' | 'move' | 'link' | 'none';
  frame?: typeof document | typeof Window | HTMLElement;
  className?: string;
  targetClassName?: string;
  draggingOverFrameClassName?: string;
  draggingOverTargetClassName?: string;
  onDragOver?: (event: any) => void;
  onDragLeave?: (event: any) => void;
  onDrop?: (fileList: FileList, event: any) => void;
  onFrameDragEnter?: (event: any) => void;
  onFrameDragLeave?: (event: any) => void;
  onFrameDrop?: (event: any) => void;
  children?: ReactNode;
};

/** @typedef {import('./file-drop').FileDropProps} FileDropProps */

/** @augments React.PureComponent<FileDropProps> */
class FileDrop extends React.PureComponent<FileDropProps> {
  static isIE = () =>
    Window &&
    Window.navigator &&
    ((Window.navigator.userAgent || []).includes('MSIE') ||
      (Window.navigator.appVersion || []).includes('Trident/'));

  static eventHasFiles = event => {
    // In most browsers this is an array, but in IE11 it's an Object :(

    let hasFiles = false;
    if (event.dataTransfer) {
      const types = event.dataTransfer.types;
      for (const keyOrIndex in types) {
        if (types[keyOrIndex] === 'Files') {
          hasFiles = true;
          break;
        }
      }
    }
    return hasFiles;
  };

  static defaultProps = {
    dropEffect: 'copy',
    frame: Window ? Window.document : undefined,
    className: 'file-drop',
    targetClassName: 'file-drop-target',
    draggingOverFrameClassName: 'file-drop-dragging-over-frame',
    draggingOverTargetClassName: 'file-drop-dragging-over-target'
  };

  frameDragCounter = 0;
  state = {draggingOverFrame: false, draggingOverTarget: false};

  componentDidMount() {
    this.startFrameListeners(this.props.frame);
    this.resetDragging();
    Window.addEventListener('dragover', this.handleWindowDragOverOrDrop);
    Window.addEventListener('drop', this.handleWindowDragOverOrDrop);
  }

  componentDidUpdate(prevProps) {
    if (prevProps.frame !== this.props.frame) {
      this.resetDragging();
      this.stopFrameListeners(prevProps.frame);
      this.startFrameListeners(this.props.frame);
    }
  }

  componentWillUnmount() {
    this.stopFrameListeners(this.props.frame);
    Window.removeEventListener('dragover', this.handleWindowDragOverOrDrop);
    Window.removeEventListener('drop', this.handleWindowDragOverOrDrop);
  }

  resetDragging = () => {
    this.frameDragCounter = 0;
    this.setState({draggingOverFrame: false, draggingOverTarget: false});
  };

  handleWindowDragOverOrDrop = event => {
    // This prevents the browser from trying to load whatever file the user dropped on the window
    event.preventDefault();
  };

  handleFrameDrag = event => {
    // Only allow dragging of files
    if (!FileDrop.eventHasFiles(event)) return;

    // We are listening for events on the 'frame', so every time the user drags over any element in the frame's tree,
    // the event bubbles up to the frame. By keeping count of how many "dragenters" we get, we can tell if they are still
    // "draggingOverFrame" (b/c you get one "dragenter" initially, and one "dragenter"/one "dragleave" for every bubble)
    // This is far better than a "dragover" handler, which would be calling `setState` continuously.
    this.frameDragCounter += event.type === 'dragenter' ? 1 : -1;

    if (this.frameDragCounter === 1) {
      this.setState({draggingOverFrame: true});
      if (this.props.onFrameDragEnter) this.props.onFrameDragEnter(event);
      return;
    }

    if (this.frameDragCounter === 0) {
      this.setState({draggingOverFrame: false});
      if (this.props.onFrameDragLeave) this.props.onFrameDragLeave(event);
      return;
    }
  };

  handleFrameDrop = event => {
    event.preventDefault();
    if (!this.state.draggingOverTarget) {
      this.resetDragging();
      if (this.props.onFrameDrop) this.props.onFrameDrop(event);
    }
  };

  handleDragOver = event => {
    if (FileDrop.eventHasFiles(event)) {
      this.setState({draggingOverTarget: true});
      if (!FileDrop.isIE() && this.props.dropEffect)
        event.dataTransfer.dropEffect = this.props.dropEffect;
      if (this.props.onDragOver) this.props.onDragOver(event);
    }
  };

  handleDragLeave = event => {
    this.setState({draggingOverTarget: false});
    if (this.props.onDragLeave) this.props.onDragLeave(event);
  };

  handleDrop = event => {
    if (this.props.onDrop && FileDrop.eventHasFiles(event)) {
      const files = event.dataTransfer ? event.dataTransfer.files : null;
      this.props.onDrop(files, event);
    }
    this.resetDragging();
  };

  stopFrameListeners = frame => {
    if (frame) {
      frame.removeEventListener('dragenter', this.handleFrameDrag);
      frame.removeEventListener('dragleave', this.handleFrameDrag);
      frame.removeEventListener('drop', this.handleFrameDrop);
    }
  };

  startFrameListeners = frame => {
    if (frame) {
      frame.addEventListener('dragenter', this.handleFrameDrag);
      frame.addEventListener('dragleave', this.handleFrameDrag);
      frame.addEventListener('drop', this.handleFrameDrop);
    }
  };

  render() {
    const {
      children,
      className,
      targetClassName,
      draggingOverFrameClassName,
      draggingOverTargetClassName
    } = this.props;
    const {draggingOverTarget, draggingOverFrame} = this.state;

    let fileDropTargetClassName = targetClassName;
    if (draggingOverFrame) fileDropTargetClassName += ` ${draggingOverFrameClassName}`;
    if (draggingOverTarget) fileDropTargetClassName += ` ${draggingOverTargetClassName}`;

    return (
      <div
        className={className}
        onDragOver={this.handleDragOver}
        onDragLeave={this.handleDragLeave}
        onDrop={this.handleDrop}
      >
        <div className={fileDropTargetClassName}>{children}</div>
      </div>
    );
  }
}

export default FileDrop;
