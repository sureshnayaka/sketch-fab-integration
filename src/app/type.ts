export type Frame = {
	frameConstraints: string;
	type: string;
	x: string;
	y: string;
	width: string;
	height: string;
	rotation: number;
	opacity: number;
	aspectRatio: number;

	pageNum: string; // Matches Page.displayNum
	page: string; // Matches Page

	fillColor: string;

	// Custom
	_frameKey: string;
	_pageId: string;
	externalID?: string;
};

type BooleanAsString = 'true' | 'false';

export type TextFrame = Frame & {
	textFlow: string;
	textLines: string;
	autoGrowFrame: boolean;
	hasOverflow: boolean;
};

export type ImageFrame = Frame & {
	type: 'image';
	fitMode: 'manual' | 'frame' | 'stretch' | 'original' | string;
	previewURL: string;
	pixelHeight: string;
	pixelWidth: string;
	realWidthPixels: number;
	realHeightPixels: number;
	realResolution: number;
	outputResolution: number;
	minOutputResolution: number;
	imgRotation: string;
	ImgHeightPixel: string;
	ImgWidthPixel: string;
	imgX: string;
	imgY: string;
	imgLoaded: BooleanAsString;
	displayX: string;
	displayY: string;

	numPages: string;

	IsLoaded: string;
};
