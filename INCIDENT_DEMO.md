# Modern SIEM Incident View Demo

## Overview

This project now includes a modern, elegant incident management interface designed to showcase what a next-generation SIEM incident view could look like. The interface is inspired by modern design systems like Linear and Wiz, featuring clean aesthetics, intuitive navigation, and comprehensive incident management capabilities.

## Features

### 🎯 Modern Design
- **Clean, minimal interface** inspired by Linear and Wiz design systems
- **Responsive layout** that works on desktop, tablet, and mobile devices
- **Elegant typography** and consistent spacing throughout
- **Smooth animations** and micro-interactions for better UX

### 🔍 Incident Analysis
- **Interactive timeline** showing the complete attack chain
- **Real-time filtering** and search functionality
- **Entity extraction** with contextual icons and tooltips
- **Severity-based color coding** for quick visual assessment

### 📊 Comprehensive Dashboard
- **Executive summary** cards showing key metrics
- **Live status indicators** with real-time updates
- **Risk assessment** with visual risk scoring
- **MITRE ATT&CK mapping** for threat intelligence

### ⚡ Quick Response Actions
- **One-click response actions** for immediate threat containment
- **IOC extraction** and export functionality
- **Stakeholder notification** system
- **Asset isolation** capabilities

## Demo Data

The demonstration uses real incident data from the signal analysis file:
- **Incident**: Multi-stage attack on EC2AMAZ-OSH4IUQ
- **Attack Vector**: ClickFix social engineering
- **Timeline**: May 17-19, 2025
- **Affected Systems**: Windows environment with Active Directory
- **Techniques**: Process injection, credential theft, persistence mechanisms

## Access

The incident view is accessible at:
- **Production**: `https://bitrot.sh/inc`
- **Development**: `http://localhost:5173/inc`

## Technical Implementation

### Architecture
- **Frontend**: React with modern hooks and functional components
- **Styling**: Tailwind CSS with custom design tokens
- **Icons**: Lucide React for consistent, scalable icons
- **Routing**: React Router for single-page application navigation
- **Data**: Static markdown analysis converted to structured incident data

### Key Components
- `ModernIncidentView.jsx` - Main incident interface component
- Interactive timeline with expandable event details
- Real-time search and filtering capabilities
- Responsive sidebar with incident metadata

### Design Principles
- **Clarity first** - Information hierarchy optimized for quick decision-making
- **Progressive disclosure** - Detailed information revealed on demand
- **Contextual actions** - Response options presented at the right time
- **Visual consistency** - Unified color system and typography

## Future Enhancements

### Planned Features
- **Real-time data integration** with SIEM platforms
- **Collaborative investigation** tools
- **Custom playbook execution**
- **Advanced threat hunting** capabilities
- **Mobile-first response** interface
- **Integration with SOAR** platforms

### Potential Integrations
- Splunk, Elastic Security, Microsoft Sentinel
- MITRE ATT&CK Navigator
- Threat intelligence feeds
- Incident response platforms
- Communication tools (Slack, Teams, PagerDuty)

## Screenshots

The interface includes:
1. **Header with live status** - Shows incident priority and real-time updates
2. **Overview cards** - Quick metrics about the incident
3. **Interactive timeline** - Chronological view of attack events
4. **MITRE ATT&CK mapping** - Threat technique categorization
5. **Asset tracking** - Affected systems and users
6. **Response actions** - One-click containment options
7. **Risk assessment** - Visual risk scoring and confidence levels

## Development

To run the incident view locally:

```bash
npm install
npm run dev
```

Then navigate to `http://localhost:5173/inc` to view the incident interface.

The interface will automatically load the signal analysis data and render the interactive incident view.

---

*This demo represents a vision for the future of security incident management interfaces, prioritizing user experience and actionable intelligence delivery.* 