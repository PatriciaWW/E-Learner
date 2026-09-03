import { AfterViewInit, Component, ElementRef, inject, OnInit, PLATFORM_ID, ViewChild } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { isPlatformBrowser } from '@angular/common';
import * as monaco from 'monaco-editor';
import { ApiS } from '../../services/api';
import { Nav } from '../nav/nav';
import { Footer } from '../footer/footer';


@Component({
  selector: 'app-code',
  imports: [RouterLink,ReactiveFormsModule,FormsModule,Nav, Footer],
  templateUrl: './code.html',
  styleUrl: './code.css',
})
export class Code implements OnInit, AfterViewInit{

  @ViewChild('editorContainer', { static: true }) editorContainer!: ElementRef;
  @ViewChild('iframe', { static: true }) iframe!: ElementRef<HTMLIFrameElement>;
  pyodide: any; // Pyodide instance

  editor!: monaco.editor.IStandaloneCodeEditor;
  output: string = ''; 
  ai_output : string = '';
  topic: any;
  t_name:any;
  selected_prompt:any;
  prompts = '';


  private route = inject(ActivatedRoute)
  private platformId = inject(PLATFORM_ID)
  private api = inject(ApiS)



  ngOnInit(){}


  ngAfterViewInit(): void {
    if (isPlatformBrowser(this.platformId)) {
      (window as any).MonacoEnvironment = {
        getWorkerUrl: function (_moduleId: any, label: string) {
          return `/assets/monaco-editor/vs/base/worker/workerMain.js`;
        }
      };
      this.loadMonacoEditor();
    }
  }



  async loadMonacoEditor() {
    // Dynamically import monaco-editor
    const monaco = await import('monaco-editor');
    this.editor = monaco.editor.create(this.editorContainer.nativeElement, {
      // value: `print("Hello, Python World!")` ,
      value: this.topic.starterCode,
      language: 'python',
      automaticLayout: true,  // Ensure the editor resizes with the container
      readOnly: false, 
      fontSize: 18, 
      fontFamily: "Courier New, monospace",
      padding: { top: 10, bottom: 10 }, 
      theme: 'vs-dark',
    });

    this.pyodide = await (window as any).loadPyodide();

    // Redirect Python's print output to a custom function
    this.pyodide.globals.set('print', (...args: any[]) => {
      const output = args.map(arg => arg.toString()).join(' ');
      this.output += output + '\n'; // Append the output to the result variable
    });

  }


// load pre written prompts for the ai to answer 
  loadPrompts(){
    this.ai_output = "";
  }


  // Get python code from the backend api
  async fetchPythonCode(event: Event): Promise<void> {
    const target = event.target as HTMLSelectElement;
    
  }


// let monaco editor interpret and run the python code
  runPythonCode(){}


// explain the python code using ai
  runPythonAi(){}


}
