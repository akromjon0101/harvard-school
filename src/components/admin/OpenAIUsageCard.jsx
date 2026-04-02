import { useState, useEffect, useCallback } from 'react'
import { BASE_URL } from '../../services/api'

const REFRESH_INTERVAL = 60_000

function usd(val) {
    if (val == null) return '—'
    if (val < 0.01) return `$${val.toFixed(5)}`
    return `$${val.toFixed(4)}`
}

const SERVICE_LABELS = { chat: '🧠 AI Grading', whisper: '🎙 Whisper', tts: '🔊 TTS' }

export default function OpenAIUsageCard() {
    const [data,         setData]         = useState(null)
    const [error,        setError]        = useState(null)
    const [loading,      setLoading]      = useState(true)
    const [lastUpdated,  setLastUpdated]  = useState(null)

    // Budget editing
    const [editingBudget,  setEditingBudget]  = useState(false)
    const [budgetInput,    setBudgetInput]    = useState('')
    const [budgetSaving,   setBudgetSaving]   = useState(false)
    const [budgetError,    setBudgetError]    = useState('')

    const fetchUsage = useCallback(async () => {
        setLoading(true)
        setError(null)
        try {
            const res  = await fetch(`${BASE_URL}/openai-usage`, {
                headers: { Authorization: `Bearer ${localStorage.getItem('token') || ''}` },
            })
            const json = await res.json()
            if (!res.ok) {
                setError(json.error || 'Unable to fetch usage data')
                setData(null)
            } else {
                setData(json)
                setLastUpdated(new Date())
            }
        } catch (err) {
            setError(`Unable to fetch usage data: ${err.message}`)
            setData(null)
        } finally {
            setLoading(false)
        }
    }, [])

    useEffect(() => { fetchUsage() }, [fetchUsage])
    useEffect(() => {
        const id = setInterval(fetchUsage, REFRESH_INTERVAL)
        return () => clearInterval(id)
    }, [fetchUsage])

    const startEditBudget = () => {
        setBudgetInput(data?.hardLimit ?? 10)
        setBudgetError('')
        setEditingBudget(true)
    }

    const saveBudget = async () => {
        const val = parseFloat(budgetInput)
        if (isNaN(val) || val <= 0) {
            setBudgetError('Musbat son kiriting')
            return
        }
        setBudgetSaving(true)
        setBudgetError('')
        try {
            const res  = await fetch(`${BASE_URL}/openai-usage/budget`, {
                method:  'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization:  `Bearer ${localStorage.getItem('token') || ''}`,
                },
                body: JSON.stringify({ budget: val }),
            })
            const json = await res.json()
            if (!res.ok) {
                setBudgetError(json.error || 'Xato yuz berdi')
            } else {
                setEditingBudget(false)
                fetchUsage()
            }
        } catch {
            setBudgetError('Xato yuz berdi')
        } finally {
            setBudgetSaving(false)
        }
    }

    const pct     = data?.usagePct ?? 0
    const warning = pct >= 80

    return (
        <div className={`adash-usage-card${warning ? ' adash-usage-card--warn' : ''}`}>

            {/* Header */}
            <div className="adash-usage-header">
                <span className="adash-usage-icon">🤖</span>
                <div>
                    <div className="adash-usage-title">OpenAI Balance</div>
                    {lastUpdated && (
                        <div className="adash-usage-subtitle">
                            Updated {lastUpdated.toLocaleTimeString()}
                        </div>
                    )}
                </div>
                <button
                    className="adash-usage-refresh"
                    onClick={fetchUsage}
                    disabled={loading}
                    title="Refresh"
                >
                    {loading ? <span className="adash-usage-spin" /> : '↻'}
                </button>
            </div>

            {/* Error */}
            {error && !loading && (
                <div className="adash-usage-error">⚠ {error}</div>
            )}

            {data && !error && (
                <>
                    {/* Progress bar */}
                    <div className="adash-usage-bar-wrap">
                        <div
                            className={`adash-usage-bar-fill${warning ? ' adash-usage-bar-fill--warn' : ''}`}
                            style={{ width: `${Math.min(pct, 100)}%` }}
                        />
                    </div>
                    <div className="adash-usage-bar-labels">
                        <span>{pct}% used</span>
                        <span>{usd(data.remaining)} remaining</span>
                    </div>

                    {/* Main stats */}
                    <div className="adash-usage-stats">
                        <div className="adash-usage-stat">
                            <div className="adash-usage-stat-label">Used this month</div>
                            <div className={`adash-usage-stat-val${warning ? ' adash-usage-stat-val--warn' : ''}`}>
                                {usd(data.monthlyUsage)}
                            </div>
                        </div>
                        <div className="adash-usage-stat">
                            <div className="adash-usage-stat-label">Remaining</div>
                            <div className="adash-usage-stat-val adash-usage-stat-val--green">
                                {usd(data.remaining)}
                            </div>
                        </div>

                        {/* Budget stat — editable */}
                        <div className="adash-usage-stat">
                            <div className="adash-usage-stat-label">
                                Monthly budget
                                {!editingBudget && (
                                    <button
                                        className="adash-usage-edit-btn"
                                        onClick={startEditBudget}
                                        title="Change budget"
                                    >
                                        ✎
                                    </button>
                                )}
                            </div>

                            {editingBudget ? (
                                <div className="adash-usage-budget-edit">
                                    <span className="adash-usage-budget-dollar">$</span>
                                    <input
                                        type="number"
                                        min="1"
                                        step="1"
                                        value={budgetInput}
                                        onChange={e => setBudgetInput(e.target.value)}
                                        className="adash-usage-budget-input"
                                        autoFocus
                                        onKeyDown={e => {
                                            if (e.key === 'Enter')  saveBudget()
                                            if (e.key === 'Escape') setEditingBudget(false)
                                        }}
                                    />
                                    <button
                                        className="adash-usage-budget-save"
                                        onClick={saveBudget}
                                        disabled={budgetSaving}
                                    >
                                        {budgetSaving ? '…' : '✓'}
                                    </button>
                                    <button
                                        className="adash-usage-budget-cancel"
                                        onClick={() => setEditingBudget(false)}
                                    >
                                        ✕
                                    </button>
                                    {budgetError && (
                                        <div className="adash-usage-budget-err">{budgetError}</div>
                                    )}
                                </div>
                            ) : (
                                <div className="adash-usage-stat-val">{usd(data.hardLimit)}</div>
                            )}
                        </div>
                    </div>

                    {/* Breakdown */}
                    {data.breakdown && Object.keys(data.breakdown).length > 0 && (
                        <div className="adash-usage-breakdown">
                            {Object.entries(data.breakdown).map(([svc, info]) => (
                                <div key={svc} className="adash-usage-breakdown-row">
                                    <span>{SERVICE_LABELS[svc] || svc}</span>
                                    <span className="adash-usage-breakdown-count">{info.count}x</span>
                                    <span className="adash-usage-breakdown-cost">{usd(info.cost)}</span>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Warning */}
                    {warning && (
                        <div className="adash-usage-warn-banner">
                            ⚠ Usage at {pct}% — approaching your {usd(data.hardLimit)} budget
                        </div>
                    )}

                    {/* Period */}
                    {data.period && (
                        <div className="adash-usage-period">
                            Period: {data.period.start} → {data.period.end}
                        </div>
                    )}
                </>
            )}

            {/* Skeleton */}
            {loading && !data && (
                <div className="adash-usage-skeleton">
                    <div className="adash-usage-skel-bar" />
                    <div className="adash-usage-skel-row">
                        <div className="adash-usage-skel-box" />
                        <div className="adash-usage-skel-box" />
                        <div className="adash-usage-skel-box" />
                    </div>
                </div>
            )}
        </div>
    )
}
