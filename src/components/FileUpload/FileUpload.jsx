import { useState, useRef, useCallback } from 'react';
import { useApp } from '../../context/AppContext';
import { parseUploadedFiles, normalizeTranscripts, getTranscriptStats } from '../../services/parser/transcriptParser';
import { formatFileSize } from '../../utils/helpers';
import './FileUpload.css';

export default function FileUpload() {
    const { state, actions } = useApp();
    const { uploadedFiles, parsedTranscripts } = state;

    const [isDragging, setIsDragging] = useState(false);
    const [processing, setProcessing] = useState(false);
    const fileInputRef = useRef(null);

    const handleDragOver = useCallback((e) => {
        e.preventDefault();
        setIsDragging(true);
    }, []);

    const handleDragLeave = useCallback((e) => {
        e.preventDefault();
        setIsDragging(false);
    }, []);

    const handleDrop = useCallback(async (e) => {
        e.preventDefault();
        setIsDragging(false);

        const files = Array.from(e.dataTransfer.files);
        await processFiles(files);
    }, []);

    const handleFileSelect = useCallback(async (e) => {
        const files = Array.from(e.target.files);
        await processFiles(files);
        e.target.value = ''; // Reset input
    }, []);

    const processFiles = async (files) => {
        const validFiles = files.filter(file =>
            file.name.endsWith('.txt') ||
            file.name.endsWith('.json') ||
            file.name.endsWith('.zip')
        );

        if (validFiles.length === 0) {
            alert('Please upload .txt, .json, or .zip files');
            return;
        }

        setProcessing(true);

        try {
            const fileData = validFiles.map(f => ({
                name: f.name,
                size: f.size,
                type: f.type,
                file: f,
                status: 'processing',
            }));

            actions.addUploadedFiles(fileData);

            const parsed = await parseUploadedFiles(validFiles);
            const normalized = normalizeTranscripts(parsed);

            // Update file statuses
            const updatedFiles = [...state.uploadedFiles, ...fileData].map(f => {
                const result = parsed.find(p => p.filename === f.name);
                return {
                    ...f,
                    status: result?.error ? 'error' : 'success',
                    error: result?.error,
                    transcriptCount: result?.transcripts?.length || 0,
                };
            });

            actions.setUploadedFiles(updatedFiles);
            actions.setParsedTranscripts([...parsedTranscripts, ...normalized]);
        } catch (error) {
            console.error('Error processing files:', error);
        } finally {
            setProcessing(false);
        }
    };

    const removeFile = (index) => {
        const file = uploadedFiles[index];
        const newFiles = uploadedFiles.filter((_, i) => i !== index);
        actions.setUploadedFiles(newFiles);

        // Also remove associated transcripts
        const newTranscripts = parsedTranscripts.filter(t => t.sourceFile !== file.name);
        actions.setParsedTranscripts(newTranscripts);
    };

    const clearAll = () => {
        actions.setUploadedFiles([]);
        actions.setParsedTranscripts([]);
    };

    const stats = getTranscriptStats(parsedTranscripts);

    const getFileIcon = (filename) => {
        if (filename.endsWith('.json')) return '📋';
        if (filename.endsWith('.zip')) return '📦';
        return '📄';
    };

    return (
        <div className="file-upload">
            <div className="file-upload-header">
                <h2 className="file-upload-title">
                    <span>📁</span>
                    Upload Transcripts
                </h2>
                {uploadedFiles.length > 0 && (
                    <span className="badge badge-primary">{uploadedFiles.length} files</span>
                )}
            </div>

            <div className="file-upload-body">
                <div
                    className={`dropzone ${isDragging ? 'dragging' : ''}`}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    onClick={() => fileInputRef.current?.click()}
                >
                    <input
                        ref={fileInputRef}
                        type="file"
                        multiple
                        accept=".txt,.json,.zip"
                        onChange={handleFileSelect}
                        style={{ display: 'none' }}
                    />

                    <span className="dropzone-icon">
                        {processing ? '⏳' : '📤'}
                    </span>
                    <p className="dropzone-text">
                        {processing ? 'Processing files...' : 'Drop transcript files here or click to browse'}
                    </p>
                    <p className="dropzone-hint">
                        Upload individual files or a ZIP containing multiple transcripts
                    </p>
                    <div className="dropzone-formats">
                        <span className="dropzone-format">.txt</span>
                        <span className="dropzone-format">.json</span>
                        <span className="dropzone-format">.zip</span>
                    </div>
                </div>

                {uploadedFiles.length > 0 && (
                    <div className="file-list">
                        <div className="file-list-header">
                            <span className="file-list-title">Uploaded Files</span>
                            <button className="file-list-clear" onClick={clearAll}>
                                Clear All
                            </button>
                        </div>

                        <div className="file-list-items">
                            {uploadedFiles.map((file, index) => (
                                <div key={`${file.name}-${index}`} className="file-item">
                                    <span className="file-item-icon">{getFileIcon(file.name)}</span>
                                    <div className="file-item-info">
                                        <div className="file-item-name">{file.name}</div>
                                        <div className="file-item-size">{formatFileSize(file.size)}</div>
                                    </div>
                                    <div className={`file-item-status ${file.status}`}>
                                        {file.status === 'processing' && <span className="spinner" />}
                                        {file.status === 'success' && (
                                            <>✅ {file.transcriptCount} conversations</>
                                        )}
                                        {file.status === 'error' && <>❌ Error</>}
                                    </div>
                                    <button
                                        className="file-item-remove"
                                        onClick={() => removeFile(index)}
                                        aria-label="Remove file"
                                    >
                                        ✕
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {parsedTranscripts.length > 0 && (
                    <div className="file-stats">
                        <div className="file-stat">
                            <div className="file-stat-value">{stats.totalConversations}</div>
                            <div className="file-stat-label">Conversations</div>
                        </div>
                        <div className="file-stat">
                            <div className="file-stat-value">{stats.totalMessages}</div>
                            <div className="file-stat-label">Messages</div>
                        </div>
                        <div className="file-stat">
                            <div className="file-stat-value">{stats.avgMessagesPerConversation}</div>
                            <div className="file-stat-label">Avg per Conversation</div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
