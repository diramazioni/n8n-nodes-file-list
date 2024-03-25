import {
	IExecuteFunctions,
	INodeExecutionData,
	INodeType,
	INodeTypeDescription,
	NodeOperationError,
} from 'n8n-workflow';

import recursiveReaddirFiles from 'recursive-readdir-files';

export class FileList implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'File List',
		name: 'fileList',
		group: ['transform'],
		version: 1,
		description: 'Get the list of files in a directory',
		defaults: {
			name: 'File List',
		},
		inputs: ['main'],
		outputs: ['main'],
		properties: [
			// Node properties which the user gets displayed and
			// can change on the node.
			{
				displayName: 'directory',
				name: 'directory',
				type: 'string',
				default: '',
				placeholder: '/tmp',
				description: 'Directory to list files',
			},
			{
				displayName: 'include file',
				name: 'includeFile',
				type: 'string',
				default: '',
				placeholder: '*.ts',
				description: 'list of files to include',
			},
			{
				displayName: 'exclude file',
				name: 'excludeFile',
				type: 'string',
				default: 'node_modules',
				placeholder: '.git,node_modules',
				description: 'list of directory to exclude',
			},
		],
	}

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
    const returnData: INodeExecutionData[] = [];

		// Retrieve input parameters
		const directory = this.getNodeParameter('directory', 0, '') as string;
		const includeFile = this.getNodeParameter('includeFile', 0, '') as string;
		const excludeFile = this.getNodeParameter('excludeFile', 0, '') as string;

		// Prepare the inclusion and exclusion patterns
		const includePatterns = includeFile.split(',').map(pattern => pattern.trim()).filter(pattern => pattern.length > 0);
		const excludePatterns = excludeFile.split(',').map(pattern => pattern.trim()).filter(pattern => pattern.length > 0);

		// Function to check if a file matches the include patterns (if any are specified)
		const matchesIncludePatterns = (filePath: string) => {
				if (includePatterns.length === 0) return true; // If no include patterns are specified, include all files
				return includePatterns.some(pattern => filePath.endsWith(pattern));
		};

		try {
				// Use recursive-readdir-files to read the list of files
				let allFiles = await recursiveReaddirFiles(directory, {
						// Directly convert exclude patterns to a RegExp and pass it to the ignored option
						ignored: new RegExp(excludePatterns.join('|'), 'i'),
				});

				// Filter files based on inclusion patterns
				let filteredFiles = allFiles.filter(file => matchesIncludePatterns(file.path));

				// Prepare the output data
				filteredFiles.map(file => {
						returnData.push({ json: { path: file.path } }); // Create an output item for each file
				});

				return this.prepareOutputData(returnData);

			} catch (error) {
				throw new NodeOperationError(this.getNode(), error);
			}
	}
}
