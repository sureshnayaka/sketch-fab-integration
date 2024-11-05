import { CommonModule } from '@angular/common';
import { AfterViewInit, Component, ElementRef, Inject, OnInit, TemplateRef, ViewChild } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { PublisherInterface } from '@chili-publish/publisher-interface';
import { DOCUMENT } from '@angular/common';
import { isPlatformBrowser } from '@angular/common';
import { PLATFORM_ID } from '@angular/core';
import { _3DModule } from './material-details';


//this are the id and apikey from elefantprint please updated has needed.
const API_CONFIG: ApiConfig = {
	ws: '040a3eef-ebcd-455e-bc1e-fd98a20446ff',
	vp: 'cda7bf48-02dc-40a5-a12e-6a50bc0ebbaa',
	apiKey: 'KATSq3Alr5bmaVCk9DerzaytHo7PHYah0onAERPvjBFvGMpw3cr2oENfKfWbNj4DYV5nW6Rbzzg4hA21ACR11x8lB1exDLjH', // Use environment variable or default value
	doc: '5c2554b8-39c6-4148-bc4c-5d7de039b71f',
	baseURL: 'https://cp-cye-648.chili-publish.online',
	environment: 'cp-cye-648',
};
// Function to construct iframe URL
const getIframeURL = (config: ApiConfig): string => {
	return `${config.baseURL}/${config.environment}/editor_html.aspx?doc=${config.doc}&ws=${config.ws}&vp=${config.vp}&viewerOnly=false&apiKey=${config.apiKey}`;
};

interface Color {
	name: string;
	rgb: string;
}

interface ApiConfig {
	ws: string;
	vp: string;
	apiKey: string;
	doc: string;
	baseURL: string;
	environment: string;
}


@Component({
	selector: 'app-root',
	standalone: true,
	imports: [CommonModule, RouterOutlet],
	templateUrl: './app.component.html',
	styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit, AfterViewInit {
	public publisher!: PublisherInterface;
	public isDialogOpen = false;
	public imageURL: string = '';
	public isLoading: boolean = true;
	public selectedColor: string = 'Black';
	public colors: Color[] = [
		{ name: 'Black', rgb: 'rgb(0, 0, 0)' },
		{ name: 'White', rgb: 'rgb(255, 255, 255)' },
		{ name: 'Red', rgb: 'rgb(255, 0, 0)' },
		{ name: 'Green', rgb: 'rgb(0, 128, 0)' },
		{ name: 'Blue', rgb: 'rgb(0, 0, 255)' },
		{ name: 'Yellow', rgb: 'rgb(255, 255, 0)' },
		{ name: 'Cyan', rgb: 'rgb(0, 255, 255)' },
		{ name: 'Magenta', rgb: 'rgb(255, 0, 255)' },
		{ name: 'Purple', rgb: 'rgb(128, 0, 128)' },
		{ name: 'Orange', rgb: 'rgb(255, 165, 0)' },
		{ name: 'Pink', rgb: 'rgb(255, 182, 193)' },
	];

	public colorMap: { [key: string]: [number, number, number] } = {
		Black: [0.0, 0.0, 0.0],
		Red: [1.0, 0.0, 0.0],
		Blue: [0.0, 0.0, 1.0],
		Green: [0.0235, 0.3255, 0.1569],
		Yellow: [1.0, 1.0, 0.0],
		Cyan: [0.0, 1.0, 1.0],
		Magenta: [1.0, 0.0, 1.0],
		Orange: [1.0, 0.5, 0.0],
		Purple: [0.5, 0.0, 0.5],
		Pink: [1.0, 0.75, 0.8],
		White: [1.0, 1.0, 1.0],
	};

	@ViewChild('chiliFrame') chiliFrame!: ElementRef<HTMLIFrameElement>;
	@ViewChild('dialogTemplate') dialogTemplate!: TemplateRef<HTMLElement>;

	constructor(@Inject(DOCUMENT) private document: Document,
		@Inject(PLATFORM_ID) private platformId: Object,
	) { }

	async changeBackgroundColor(index: number) {
		const color = this.colors[index];
		this.selectedColor = color.name;
	}

	getColorRGB(colorName: string): [number, number, number] | undefined {
		return this.colorMap[colorName];
	}

	async openDialog() {
		this.isDialogOpen = true;
		this.isLoading = true;
		this.loadingComplete(3000); // Delay for loading animation

		try {
			const previewDataB64 = await this.getPageSnapshot('350x250', 0); // Size can be dynamic, 350x250 for demo

			if (previewDataB64) {
				this.imageURL = `data:image/png;base64,${previewDataB64}`;
				this.initialize3DModule(this.imageURL);
			}
		} catch (error) {
			console.error("Error fetching page snapshot:", error);
		}
	}

	private loadingComplete(delay: number): void {
		setTimeout(() => {
			this.isLoading = false;
		}, delay);
	}

	private initialize3DModule(imageUrl: string): void {
		let color: any = this.getColorRGB(this.selectedColor);
		_3DModule(imageUrl, color); // 3D model interaction
	}

	async closeDialog() {
		this.isDialogOpen = false;
		await this.setPanelsVisibility(false);
		await this.alignCanvasCenter();
	}

	// region : preview
	async getPageSnapshot(
		size: string | {
			width: number;
			height: number;
		},
		pageIndex: number = 0,
		transparent: boolean = true,
		viewMode: "preview" | "edit" | "technical" = 'preview',
		layers: string[] | null = null,
		frames: string[] | null = null
	): Promise<string | null> {
		try {
			return await this.publisher?.getPageSnapshot(
				pageIndex,
				size,
				layers,
				frames,
				viewMode,
				transparent
			);
		} catch (error) {
			console.error('Error fetching page snapshot:');
			return null;
		}
	}
	// end : preview

	async setPanelsVisibility(visible: boolean) {
		const panelVisibilityPromises = [
			this.setPropertyByType(`editor.topPanel`, `visible`, visible),
			this.setPropertyByType(`editor.bottomPanel`, `visible`, visible),
			this.setPropertyByType(`editor.leftPanels`, `visible`, visible),
			this.setPropertyByType(`editor.rightPanels`, `visible`, visible),
		];

		return Promise.allSettled(panelVisibilityPromises);
	}

	async getPropertyByType<T>(path: string) {
		return await this.publisher.getObject(path) as T;
	}

	async setPropertyByType(path: string, key: string, value: string | boolean | number | null) {
		return await this.publisher.setProperty(path, key, value);
	}

	private onWindowResize() {
		void this.alignCanvasCenter();
	}

	async alignCanvasCenter() {
		let containerSize: DOMRect;
		do {
			containerSize = this.chiliFrame.nativeElement.getBoundingClientRect();
			await new Promise<void>((resolve) => setTimeout(resolve, 10));
		} while (containerSize.width < 1 && containerSize.height < 1);

		const [pixelWidth, pixelHeight, zoom] = await Promise.all([
			this.getPropertyByType<number>("document.pixelWidth"),
			this.getPropertyByType<number>("document.pixelHeight"),
			this.getPropertyByType<number>("document.zoom"),
		]);
		let zoomFactor = zoom * 0.01;
		let pageWidthPx = pixelWidth * zoomFactor;
		let pageHeightPx = pixelHeight * zoomFactor;
		let newZoom = zoom;

		const editorWidthPx = containerSize.width;
		const editorHeightPx = containerSize.height;

		const minimumXMargin = 50;
		const minimumYMargin = 10;

		const usableEditorWidth = editorWidthPx - minimumXMargin;
		const usableEditorHeight = editorHeightPx - minimumYMargin;

		const scaleWidth = pageWidthPx / usableEditorWidth;
		const scaleHeight = pageHeightPx / usableEditorHeight;
		if (scaleWidth > 1 || scaleHeight > 1) {
			// page exceeds the editor bounds, zoom out

			let scaleDown = Math.max(scaleWidth, scaleHeight);
			// round zoom factor to two decimal places
			const newZoomFactor = Math.round(zoomFactor * 100 / scaleDown) / 100;
			scaleDown = zoomFactor / newZoomFactor;
			newZoom = Math.round(newZoomFactor * 100);

			pageWidthPx = Math.round(pageWidthPx / scaleDown);
			pageHeightPx = Math.round(pageHeightPx / scaleDown);
		} else {
			// editor has more width and height than the page does, zoom the page in
			let scaleUp = Math.max(scaleWidth, scaleHeight);
			// round zoom factor to two decimal places
			const newZoomFactor = Math.round(zoomFactor * 100 / scaleUp) / 100;
			scaleUp = zoomFactor / newZoomFactor;
			newZoom = Math.round(newZoomFactor * 100);

			pageWidthPx = Math.round(pageWidthPx / scaleUp);
			pageHeightPx = Math.round(pageHeightPx / scaleUp);
		}
		const beginX = Math.round((editorWidthPx - pageWidthPx) / 2);
		const beginY = Math.round((editorHeightPx - pageHeightPx) / 2);

		await Promise.all([
			this.setPropertyByType('doc.undoManager', 'holdChanges', true),
			this.setPropertyByType('document', `zoom`, newZoom),
			this.setPropertyByType('document.viewPreferences', 'pageCanvasMarginX', beginX),
			this.setPropertyByType('document.viewPreferences', 'pageCanvasMarginY', beginY),
			this.setPropertyByType('document.viewPreferences', 'pageFitMarginX', beginX),
			this.setPropertyByType('document.viewPreferences', 'pageFitMarginY', beginY),
			this.setPropertyByType('document.viewPreferences', 'pageMarginsX', beginX),
			this.setPropertyByType('document.viewPreferences', 'pageMarginsY', beginY),
			this.setPropertyByType('document.viewPreferences', 'showScrolls', false),
			this.publisher.executeFunction("document.editor", "Fit", "page"),
			this.setPropertyByType('doc.undoManager', 'holdChanges', false),
		]);
	}

	// region : iframe initalization
	async ngAfterViewInit(): Promise<void> {
		const iframe = this.chiliFrame.nativeElement;
		iframe.src = getIframeURL(API_CONFIG);
		if (isPlatformBrowser(this.platformId)) {
			try {
				this.publisher = await PublisherInterface.buildWithIframe(iframe, {
					debug: false,
					timeout: 5500
				});
				await this.publisher.addListener('WorkSpaceRendered', async () => {
					await this.setPanelsVisibility(false);
				});

				await this.publisher.addListener('DocumentFullyRendered', async () => {
					this.alignCanvasCenter();
					await this.setPanelsVisibility(false);
				});

				window.addEventListener('resize', () => { this.onWindowResize() });
			} catch (error) {
				console.error("Error initializing publisher:", error);
			}
		} else {
			console.warn("Not in a browser context, publisher initialization skipped.");
		}
	}

	async ngOnInit() {
		console.log("Initialized");
	}
}
