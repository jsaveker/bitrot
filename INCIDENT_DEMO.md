# Incident dashboard demo

[← Back to the README](README.md) · [Open the dashboard](https://bitrot.sh/inc)

The `/inc` route is a demonstration of an incident investigation interface, built around bundled material from a May 17–19, 2025 analysis. It is not connected to a live SIEM or response service.

![The incident dashboard with summary cards, a searchable timeline, and context sidebar](docs/images/incident-dashboard.jpg)

## Working interactions

- Search six bundled timeline events by title or description.
- Filter events by severity.
- Expand event details and collapse dashboard sections.
- Review overview metrics, related entities, risk presentation, and MITRE ATT&CK mappings.

## Presentation controls

The export, share, containment, notification, and other response buttons are visual placeholders. They do not export evidence, send messages, isolate assets, or run playbooks. Status labels such as “Live Investigation” and “Last update 2 min ago” are fixed demo text.

## Data and implementation

[`ModernIncidentView.jsx`](src/components/ModernIncidentView.jsx) contains the dashboard and its hardcoded `incidentData` object. It also fetches the bundled [incident analysis](public/incident/signal_analysis_2025_05_17_to_19.md), but the fetched Markdown does not populate the dashboard events. Editing the Markdown alone will not update those events.

The separate [`/incident` report](https://bitrot.sh/incident) renders the narrative and a React Flow graph. These are two distinct presentations of the historical example.

## Preview locally

```bash
npm ci
npm run dev
```

Open the Vite URL with `/inc` appended. This view uses bundled assets and can run without KV or R2. See the [developer guide](docs/DEVELOPMENT.md) for the rest of the application.

Potential next steps include one shared incident schema, clear demonstration labels, accessible controls, and either implementing or removing inactive actions.
