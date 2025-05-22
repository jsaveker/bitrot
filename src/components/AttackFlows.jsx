import React, { useState, useEffect } from 'react';
import { Link, Routes, Route, useParams, useNavigate } from 'react-router-dom';

function AttackFlowList({ files }) {
    return (
        <div className="p-8 bg-gray-900 text-green-400 min-h-screen font-mono">
            <h1 className="text-4xl mb-8 text-red-500">[CLASSIFIED] Attack Vectors</h1>
            <p className="mb-4 text-yellow-400">// ALERT: Accessing these files may trigger automated security responses.</p>
            <p className="mb-8">The following documents detail known exploit pathways and theoretical attack flows. Handle with extreme caution.</p>
            <ul className="list-disc list-inside space-y-2">
                {files.map(file => (
                    <li key={file.id}>
                        <Link 
                            to={`/attack/${file.id}`}
                            className="hover:text-white hover:bg-red-600 px-1 transition-colors duration-150"
                        >
                            {file.title}
                        </Link>
                    </li>
                ))}
            </ul>
             <Link to="/" className="mt-8 inline-block text-sm text-cyberpunk-secondary hover:text-white hover:bg-cyberpunk-accent px-1 underline transition-all duration-150">
                &lt; Back to Safety
            </Link>
        </div>
    );
}

function AttackFlowViewer() {
    const { fileId } = useParams();
    const navigate = useNavigate();
    const filePath = `/attack-flow/${fileId}.html`;

    // Basic check to prevent obviously malicious paths, though server-side validation is key for real security
    if (!fileId || !/^[a-zA-Z0-9_-]+$/.test(fileId)) {
        return <div className="p-8 bg-gray-900 text-red-500 min-h-screen font-mono">Error: Invalid file ID.</div>;
    }

    return (
        <div className="bg-gray-900 min-h-screen flex flex-col">
            <div className="p-4 bg-black text-yellow-400 font-mono flex justify-between items-center border-b border-red-500">
                <h2 className="text-lg">Viewing: {fileId}.html</h2>
                <button 
                    onClick={() => navigate('/attack')} 
                    className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 text-sm transition-colors duration-150"
                >
                    Close Document
                </button>
            </div>
            <iframe
                src={filePath}
                title={fileId}
                className="w-full h-full flex-grow border-none"
            />
        </div>
    );
}

function AttackFlows() {
    const [files, setFiles] = useState([]);
    const [error, setError] = useState(null);

    useEffect(() => {
        fetch('/attack-flows') // This will hit your new Cloudflare Function
            .then(res => {
                if (!res.ok) {
                    throw new Error(`HTTP error! status: ${res.status}`);
                }
                return res.json();
            })
            .then(data => setFiles(data))
            .catch(err => {
                console.error("Error fetching attack flow list:", err);
                setError("Failed to load attack vector list. System interference suspected.");
            });
    }, []);

    if (error) {
        return <div className="p-8 bg-gray-900 text-red-500 min-h-screen font-mono">{error}</div>;
    }

    if (!files.length && !error) {
         return <div className="p-8 bg-gray-900 text-green-400 min-h-screen font-mono">Loading intel...</div>;
    }

    return (
        <Routes>
            <Route path="/" element={<AttackFlowList files={files} />} />
            <Route path="/:fileId" element={<AttackFlowViewer />} />
        </Routes>
    );
}

export default AttackFlows; 