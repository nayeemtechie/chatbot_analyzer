import { ANALYSIS_STAGES } from '../../utils/constants';
import './ProgressBar.css';

export default function ProgressBar({ currentStage, progress, error }) {
    const getStageStatus = (stageId) => {
        const currentIndex = ANALYSIS_STAGES.findIndex(s => s.id === currentStage);
        const stageIndex = ANALYSIS_STAGES.findIndex(s => s.id === stageId);

        if (stageIndex < currentIndex) return 'completed';
        if (stageIndex === currentIndex) return 'active';
        return 'pending';
    };

    return (
        <div className="progress-container">
            <div className="progress-header">
                <h3 className="progress-title">
                    <span className="spinner-lg" />
                    Analyzing Transcripts...
                </h3>
                <span className="progress-percentage">{Math.round(progress)}%</span>
            </div>

            <div className="progress-bar-wrapper">
                <div
                    className="progress-bar-fill"
                    style={{ width: `${progress}%` }}
                />
            </div>

            <div className="progress-stages">
                {ANALYSIS_STAGES.map((stage) => {
                    const status = getStageStatus(stage.id);
                    return (
                        <div
                            key={stage.id}
                            className={`progress-stage ${status}`}
                        >
                            <span className="progress-stage-icon">{stage.icon}</span>
                            <span className="progress-stage-name">{stage.name}</span>
                        </div>
                    );
                })}
            </div>

            {error && (
                <div className="progress-error">
                    <div className="progress-error-title">
                        <span>❌</span>
                        Analysis Error
                    </div>
                    <p className="progress-error-message">{error}</p>
                </div>
            )}
        </div>
    );
}
