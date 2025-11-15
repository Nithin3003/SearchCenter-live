import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Shield,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Refresh,
  Download,
  Terminal,
  Zap,
  Database,
  CreditCard,
  Mail,
  BarChart3,
  Settings,
  Play,
  Clock
} from 'lucide-react';
import { serviceIntegration } from '../services/serviceIntegration';
import { config } from '../config/envConfig';

interface IntegrationTesterProps {
  className?: string;
}

export default function ServiceIntegrationTester({ className = '' }: IntegrationTesterProps) {
  const [isRunning, setIsRunning] = useState(false);
  const [testResults, setTestResults] = useState<any>(null);
  const [currentStep, setCurrentStep] = useState<string>('');
  const [logs, setLogs] = useState<string[]>([]);

  useEffect(() => {
    addLog('🚀 Service Integration Tester initialized');
    addLog(`📧 Admin Email: ${config.getAdminConfig().email}`);
    addLog(`🌍 Environment: ${config.getDeployment().nodeEnv}`);
  }, []);

  const addLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setLogs(prev => [...prev, `[${timestamp}] ${message}`]);
  };

  const runIntegrationTest = async () => {
    setIsRunning(true);
    setLogs([]);
    addLog('🔍 Starting comprehensive service integration test...');

    try {
      const results = await serviceIntegration.runCompleteIntegrationTest();
      setTestResults(results);

      addLog('📊 Integration test completed');
      addLog(`🎯 Overall Status: ${results.overallStatus.toUpperCase()}`);
      addLog(`✅ Passed Tests: ${results.tests.filter((t: any) => t.status === 'passed').length}/${results.tests.length}`);
      addLog(`💡 Recommendations: ${results.recommendations.length} generated`);

      results.tests.forEach((test: any) => {
        const icon = test.status === 'passed' ? '✅' : test.status === 'failed' ? '❌' : '⏳';
        addLog(`${icon} ${test.name}: ${test.status} (${test.duration}ms)`);
        if (test.error) {
          addLog(`   └─ Error: ${test.error}`);
        }
      });

      results.recommendations.forEach((rec: string) => {
        addLog(`💡 ${rec}`);
      });

    } catch (error) {
      addLog(`❌ Integration test failed: ${error}`);
    } finally {
      setIsRunning(false);
    }
  };

  const exportResults = () => {
    if (!testResults) return;

    const data = serviceIntegration.exportTestResults();
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `integration-test-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);

    addLog('📁 Integration test results exported');
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'passed': return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'failed': return <XCircle className="h-5 w-5 text-red-500" />;
      case 'running': return <Refresh className="h-5 w-5 text-blue-500 animate-spin" />;
      default: return <AlertTriangle className="h-5 w-5 text-yellow-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy': return 'text-green-600';
      case 'degraded': return 'text-yellow-600';
      case 'error': return 'text-red-600';
      case 'not_configured': return 'text-gray-600';
      default: return 'text-gray-600';
    }
  };

  return (
    <div className={`bg-white rounded-xl shadow-lg border border-gray-200 ${className}`}>
      {/* Header */}
      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white p-6 rounded-t-xl">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <Shield className="h-6 w-6 mr-3" />
            <div>
              <h2 className="text-xl font-bold">Service Integration Tester</h2>
              <p className="text-indigo-100 text-sm">Comprehensive system health and configuration test</p>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <button
              onClick={exportResults}
              disabled={!testResults || isRunning}
              className="px-4 py-2 bg-white bg-opacity-20 text-white rounded-lg hover:bg-opacity-30 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
            >
              <Download className="h-4 w-4 mr-2" />
              Export Results
            </button>
            <button
              onClick={runIntegrationTest}
              disabled={isRunning}
              className="px-4 py-2 bg-white text-indigo-600 rounded-lg hover:bg-gray-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center font-medium"
            >
              {isRunning ? (
                <>
                  <Refresh className="h-4 w-4 mr-2 animate-spin" />
                  Testing...
                </>
              ) : (
                <>
                  <Play className="h-4 w-4 mr-2" />
                  Run Tests
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Test Status */}
      {testResults && (
        <div className="p-6 border-b border-gray-200">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className={`bg-gray-50 rounded-xl p-4 border-l-4 ${
              testResults.overallStatus === 'success' ? 'border-green-500' :
              testResults.overallStatus === 'warning' ? 'border-yellow-500' : 'border-red-500'
            }`}>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-700">Overall Status</span>
                {testResults.overallStatus === 'success' ? <CheckCircle className="h-5 w-5 text-green-500" /> :
                 testResults.overallStatus === 'warning' ? <AlertTriangle className="h-5 w-5 text-yellow-500" /> :
                 <XCircle className="h-5 w-5 text-red-500" />}
              </div>
              <div className={`text-lg font-bold ${
                testResults.overallStatus === 'success' ? 'text-green-600' :
                testResults.overallStatus === 'warning' ? 'text-yellow-600' : 'text-red-600'
              }`}>
                {testResults.overallStatus.toUpperCase()}
              </div>
            </div>

            <div className="bg-gray-50 rounded-xl p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-700">Tests Passed</span>
                <CheckCircle className="h-5 w-5 text-green-500" />
              </div>
              <div className="text-lg font-bold text-gray-900">
                {testResults.tests.filter((t: any) => t.status === 'passed').length}/{testResults.tests.length}
              </div>
            </div>

            <div className="bg-gray-50 rounded-xl p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-700">Services Healthy</span>
                <Zap className="h-5 w-5 text-blue-500" />
              </div>
              <div className="text-lg font-bold text-gray-900">
                {testResults.services.filter((s: any) => s.status === 'healthy').length}/{testResults.services.length}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Test Results */}
      {testResults && (
        <div className="p-6">
          {/* Test Details */}
          <div className="mb-8">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <Terminal className="h-5 w-5 mr-2 text-blue-600" />
              Test Results
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {testResults.tests.map((test: any, index: number) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="bg-gray-50 rounded-xl p-4 border border-gray-200"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center">
                      {getStatusIcon(test.status)}
                      <div className="ml-3">
                        <h4 className="font-medium text-gray-900">{test.name}</h4>
                        <p className="text-sm text-gray-600">{test.description}</p>
                      </div>
                    </div>
                    {test.duration && (
                      <div className="flex items-center text-xs text-gray-500">
                        <Clock className="h-3 w-3 mr-1" />
                        {test.duration}ms
                      </div>
                    )}
                  </div>

                  {test.error && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                      <p className="text-sm text-red-800 font-medium">Error:</p>
                      <p className="text-sm text-red-700">{test.error}</p>
                    </div>
                  )}

                  {test.result && (
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                      <p className="text-xs text-blue-800 font-medium mb-2">Result Details:</p>
                      <pre className="text-xs text-blue-700 overflow-x-auto">
                        {JSON.stringify(test.result, null, 2)}
                      </pre>
                    </div>
                  )}
                </motion.div>
              ))}
            </div>
          </div>

          {/* Service Status */}
          <div className="mb-8">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <Settings className="h-5 w-5 mr-2 text-purple-600" />
              Service Status
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {testResults.services.map((service: any, index: number) => (
                <div key={index} className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium text-gray-900 capitalize">{service.name}</span>
                    <span className={`text-sm ${getStatusColor(service.status)}`}>
                      {service.status.replace('_', ' ').toUpperCase()}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600">{service.message}</p>
                  {service.responseTime && (
                    <div className="mt-2 text-xs text-gray-500">
                      Response time: {service.responseTime}ms
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Recommendations */}
          {testResults.recommendations.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <AlertTriangle className="h-5 w-5 mr-2 text-yellow-600" />
                Recommendations
              </h3>
              <div className="space-y-3">
                {testResults.recommendations.map((recommendation: string, index: number) => (
                  <div key={index} className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
                    <p className="text-sm text-yellow-800">{recommendation}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Console Output */}
      <div className="border-t border-gray-200">
        <div className="p-4 bg-gray-900 text-green-400 font-mono text-sm rounded-b-xl">
          <div className="max-h-64 overflow-y-auto">
            {logs.map((log, index) => (
              <div key={index} className="mb-1">
                {log}
              </div>
            ))}
            {isRunning && (
              <div className="flex items-center">
                <span className="animate-pulse">●</span>
                <span className="ml-2">Test in progress...</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}