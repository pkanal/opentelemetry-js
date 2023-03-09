"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const instrumentation_1 = require("@opentelemetry/instrumentation");
const api_1 = require("@opentelemetry/api");
const instrumentation_http_1 = require("@opentelemetry/instrumentation-http");
const sdk_trace_node_1 = require("@opentelemetry/sdk-trace-node");
const sdk_trace_base_1 = require("@opentelemetry/sdk-trace-base");
const exporter_trace_otlp_proto_1 = require("@opentelemetry/exporter-trace-otlp-proto");
const resources_1 = require("@opentelemetry/resources");
const semantic_conventions_1 = require("@opentelemetry/semantic-conventions");
const serviceName = 'hello-cjs';
api_1.diag.setLogger(new api_1.DiagConsoleLogger(), api_1.DiagLogLevel.DEBUG);
const tracerProvider = new sdk_trace_node_1.NodeTracerProvider({
    resource: new resources_1.Resource({
        [semantic_conventions_1.SemanticResourceAttributes.SERVICE_NAME]: serviceName,
    }),
});
const consoleExporter = new sdk_trace_base_1.ConsoleSpanExporter();
const otlpExporter = new exporter_trace_otlp_proto_1.OTLPTraceExporter({
    url: 'https://api.honeycomb.io/v1/traces',
    headers: {
        'x-honeycomb-team': process.env.HONEYCOMB_API_KEY || '',
    },
});
const simpleProcessor = new sdk_trace_base_1.SimpleSpanProcessor(consoleExporter);
const batchProcessor = new sdk_trace_base_1.BatchSpanProcessor(otlpExporter);
tracerProvider.addSpanProcessor(simpleProcessor);
tracerProvider.addSpanProcessor(batchProcessor);
tracerProvider.register();
class TestInstrumentation extends instrumentation_1.InstrumentationBase {
    constructor() {
        super('@hny/test-instrumentation', '0.0.1');
    }
    init() {
        console.log('@hny/test-instrumentation initialized!');
        return new instrumentation_1.InstrumentationNodeModuleDefinition('test', ['*']);
    }
}
(0, instrumentation_1.registerInstrumentations)({
    instrumentations: [new instrumentation_http_1.HttpInstrumentation(), new TestInstrumentation()],
});
const express_1 = __importDefault(require("express"));
const app = (0, express_1.default)();
const hostname = '0.0.0.0';
const port = 1234;
app.get('/', (_req, res, next) => {
    try {
        const autoinstr = api_1.trace === null || api_1.trace === void 0 ? void 0 : api_1.trace.getActiveSpan();
        autoinstr === null || autoinstr === void 0 ? void 0 : autoinstr.setAttribute('instr.source', 'auto-instrumented');
        res.statusCode = 200;
        res.setHeader('Content-Type', 'text/plain');
        const tracer = api_1.trace.getTracer('manual-tracer');
        tracer.startActiveSpan('manual', (span) => {
            console.log(`this is created from trace.getTracer("manual-tracer")!`);
            span.setAttribute('instr.source', 'manually-instrumented');
            span.end();
        });
        res.end('Hello, World!\n');
    }
    catch (err) {
        next(err);
    }
});
app.listen(port, hostname, () => {
    console.log(`Now listening on: http://${hostname}:${port}/`);
});
