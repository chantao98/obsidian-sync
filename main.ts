import {
	App,
	Editor,
	MarkdownView,
	// Menu,
	Modal,
	Notice,
	Plugin,
	PluginSettingTab,
	Setting,
	TFile,
	TFolder,
} from "obsidian";
import { moment } from "obsidian";

interface MyPluginSettings {
	siteUrl: string;
}

const DEFAULT_SETTINGS: MyPluginSettings = {
	siteUrl: "http://localhost:3000/api",
};

const queuePath = 'log/queue.tmp'

export default class MyPlugin extends Plugin {
	settings: MyPluginSettings;

	private isEventInProgress:boolean=false
	private eventQueue:(()=>Promise<void>)[]=[]

	async onload() {
		await this.loadSettings();
		
		//declare vault but not sure of complications that come with it
		const vault = this.app.vault

		this.registerEvent(vault.on('modify',(file)=>{
			//reset timer
			console.log(file.name)
			//Add to temp changes
			
			//Start timer (both idler and perma)
			//timer should trigger the upload (plus internet check, if not internet save the temp file) and also clear the other timer whichever triggered first
			//maybe on internet status change upload temmp or keep trying if failed


		}))
		
		this.registerEvent(vault.on('rename',async (file,oldPath)=>{
			console.log(file.path)

			//Build change Item
			const changeItem = {
				isUpload:true,
				method:'rename',
				old_path:oldPath,
				filename:file.name,
				data:null,
				timestamp:moment.utc(),
				device_id:''
			}
			
			//Add to queue
			
			
		}))
		
		this.registerEvent(vault.on('delete',(file)=>{
			console.log(`${file.path} removed`)
		}))
		
		this.app.workspace.onLayoutReady(()=>{
			this.registerEvent(vault.on('create',(file)=>{
				console.log(`${file.name} created`)
			}))
		})



		// This creates an icon in the left ribbon.
		const ribbonIconEl = this.addRibbonIcon(
			"folder-sync",
			"Manual Sync",
			async (evt: MouseEvent) => {
				// Called when the user clicks the icon.
				new Notice(`Api Url: ${this.settings.siteUrl}`);
				const fileList = this.app.vault.getAllLoadedFiles();
				fileList.forEach((item:any)=>{
					if(item instanceof TFile){
						console.log(`${item.name} is a File, ${Object.keys(item).join(',')}`)
					}else if (item instanceof TFolder){
						console.log(`${item.name} is a Folder, ${Object.keys(item).join(',')}`)
					}else {
						console.log(`What are you ${typeof item}`)
					}
				})
				// try{
				// 	await this.app.vault.createFolder('Test')
				// 	this.app.vault.create('Test/Test2.md','Example text')
				// }catch(err){
				// 	console.error(err)
				// 	this.app.vault.create('Test/Test2.md','Example text')
				// }
			}
		);
		// Perform additional things with the ribbon
		ribbonIconEl.addClass("my-plugin-ribbon-class");

		// This adds a status bar item to the bottom of the app. Does not work on mobile apps.
		const statusBarItemEl = this.addStatusBarItem();
		statusBarItemEl.setText("Status Bar Text");

		// This adds a simple command that can be triggered anywhere
		this.addCommand({
			id: "open-sample-modal-simple",
			name: "Open sample modal (simple)",
			callback: () => {
				new SampleModal(this.app).open();
			},
		});
		
		// This adds an editor command that can perform some operation on the current editor instance
		this.addCommand({
			id: "sample-editor-command",
			name: "Sample editor command",
			editorCallback: (editor: Editor, view: MarkdownView) => {
				console.log(editor.getSelection());
				editor.replaceSelection("Sample Editor Command");
			},
		});
		// This adds a complex command that can check whether the current state of the app allows execution of the command
		this.addCommand({
			id: "open-sample-modal-complex",
			name: "Open sample modal (complex)",
			checkCallback: (checking: boolean) => {
				// Conditions to check
				const markdownView =
					this.app.workspace.getActiveViewOfType(MarkdownView);
				if (markdownView) {
					// If checking is true, we're simply "checking" if the command can be run.
					// If checking is false, then we want to actually perform the operation.
					if (!checking) {
						new SampleModal(this.app).open();
					}

					// This command will only show up in Command Palette when the check function returns true
					return true;
				}
			},
		});

		// This adds a settings tab so the user can configure various aspects of the plugin
		this.addSettingTab(new BasicSettingTab(this.app, this));

		// If the plugin hooks up any global DOM events (on parts of the app that doesn't belong to this plugin)
		//Register Event Listener that will be removed when plugin disabled
		this.registerDomEvent(document, "click", (evt: MouseEvent) => {
			console.log("click", evt);
		});

		//Register Action on Interval that will be cleared when plugin is disabled
		this.registerInterval(
			window.setInterval(() => this.updateStatusBarDate(statusBarItemEl), 1000)
		);
	}

	onunload() {}

	async loadSettings() {
		this.settings = Object.assign(
			{},
			DEFAULT_SETTINGS,
			await this.loadData()
		);
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}
	
	async apiFetch(url:string,method?:string,headers?:any,body?:any) {
		const {url: _, ...rest} = {url,method,headers,body}
	  
		if (method || headers) {
		  const promise = fetch(url,rest)
			.then((res) => res.json())
			.then((res) => {
			  // console.log(res.data);
			  return res.data
		  });
		  // return wrapPromise(promise);
		  return promise
		}
	  
		const promise = fetch(url)
		  .then((res) => res.json())
		  .then((res) => res.data);
		return promise;
	}

	async handleQueue(){
		//Check if event in progress
		if(this.isEventInProgress){
			//Add to queue
		}else{
			//execute event

		}
	}

	async handleApiError(){
		//Exponential backoff for now

	}

	//for testing
	updateStatusBarDate(statusBarElement: HTMLElement) {
		statusBarElement.setText(moment().format("YYYY-MM-DD H:mm:ss"));
	}

}

class SampleModal extends Modal {
	constructor(app: App) {
		super(app);
	}

	onOpen() {
		const { contentEl } = this;
		contentEl.setText("Woah!");
	}

	onClose() {
		const { contentEl } = this;
		contentEl.empty();
	}
}

class BasicSettingTab extends PluginSettingTab {
	plugin: MyPlugin;

	constructor(app: App, plugin: MyPlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const { containerEl } = this;

		containerEl.empty();

		new Setting(containerEl)
			.setName("Sync url")
			.setDesc("Address of the site used to sync data")
			.addText((text) =>
				text
					.setPlaceholder("Enter url")
					.setValue(this.plugin.settings.siteUrl)
					.onChange(async (value) => {
						this.plugin.settings.siteUrl = value;
						await this.plugin.saveSettings();
					})
			);
	}
}
