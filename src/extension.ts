import { performance } from 'perf_hooks';
import * as vscode from 'vscode';

const supportLanguages = ['typescript', 'javascript'];

const regex = new RegExp(/(^[\t ]*import\s.*?)\bfrom\s*[^\n]+$/gm);
const groupRegex = new RegExp("(" + regex.source +"\n)+", "gm");

export function getRanges(doc: vscode.TextDocument, text: string) {
	var importGroups = [...text.matchAll(groupRegex)];

	return importGroups.flatMap(grp => {
		var matches = [...grp[0].matchAll(regex)];
		var maxImport = Math.max(...matches.map(match => match[1].length)) + 1;
		var start = grp.index!;
		var space = new Array(maxImport).join('\xa0');

		return matches
			.map((match) => ({
				range: doc.validateRange(
					new vscode.Range(
						doc.positionAt(start + match.index! + match[1].length),
						doc.positionAt(start + match.index! + match[1].length)
					)
				),
				renderOptions: {
					before: {
						contentText: space.slice(match[1].length)
					}
				}
			}) as vscode.DecorationOptions);
	});
}

function updateDecorations(activeEditor: vscode.TextEditor) {

	if (!activeEditor) {
		return;
	}

	let doc = activeEditor.document;
	let lang = doc.languageId;

	if (!supportLanguages.includes(lang)) {
		return;
	}
	
	let t0 = performance.now();

	const text = doc.getText();
	let ranges = getRanges(doc, text);

	let t1 = performance.now();
	
	console.log("Call to getRanges took " + (t1 - t0) + " milliseconds.");

	if (ranges.length) {
		activeEditor.setDecorations(ntGDecorationType, ranges);
	}


};

export function activate(context: vscode.ExtensionContext) {

	// Use the console to output diagnostic information (console.log) and errors (console.error)
	// This line of code will only be executed once when your extension is activated

	let activeEditor = vscode.window.activeTextEditor;
	if (activeEditor) {
		updateDecorations(activeEditor);
	}

	vscode.window.onDidChangeActiveTextEditor(editor => {
		if (editor) {
			updateDecorations(editor);
		}
	}, null, context.subscriptions);

	vscode.workspace.onDidChangeTextDocument(event => {
		if (activeEditor && event.document === activeEditor.document) {
			updateDecorations(activeEditor);
		}
	}, null, context.subscriptions);

}

const ntGDecorationType = vscode.window.createTextEditorDecorationType({});

export function deactivate() { }
