import type { RequestHandler } from '@sveltejs/kit';
import { WebStandardStreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/webStandardStreamableHttp.js';
import { getEditorMcpServer } from '$lib/mcp/server.js';

// Keep one transport per session so the MCP server can maintain state.
// For a single-user editor this is a simple map keyed by session ID.
const transports = new Map<string, WebStandardStreamableHTTPServerTransport>();

function getOrCreateTransport(): WebStandardStreamableHTTPServerTransport {
	// Stateless mode for simplicity — single user editor
	const sessionKey = '__default__';
	let transport = transports.get(sessionKey);
	if (!transport) {
		transport = new WebStandardStreamableHTTPServerTransport({
			sessionIdGenerator: () => sessionKey,
			onsessioninitialized: (id) => {
				transports.set(id, transport!);
			},
		});

		// Connect the MCP server to this transport
		const server = getEditorMcpServer();
		server.connect(transport).catch((err) => {
			console.error('MCP server connect error:', err);
		});

		transports.set(sessionKey, transport);
	}
	return transport;
}

async function handleMcpRequest(request: Request): Promise<Response> {
	try {
		const transport = getOrCreateTransport();
		return await transport.handleRequest(request);
	} catch (err) {
		console.error('MCP request error:', err);
		return new Response(JSON.stringify({ error: 'Internal MCP error' }), {
			status: 500,
			headers: { 'Content-Type': 'application/json' },
		});
	}
}

export const GET: RequestHandler = async ({ request }) => {
	return handleMcpRequest(request);
};

export const POST: RequestHandler = async ({ request }) => {
	return handleMcpRequest(request);
};

export const DELETE: RequestHandler = async ({ request }) => {
	return handleMcpRequest(request);
};
