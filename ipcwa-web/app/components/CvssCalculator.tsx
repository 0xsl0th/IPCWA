'use client';

import { useState, useEffect } from 'react';

// CVSS 3.1 Constants and Logic
// Simplified implementation of the official equations
// Source: https://www.first.org/cvss/v3.1/specification-document

const METRICS = {
    AV: { N: 0.85, A: 0.62, L: 0.55, P: 0.2 },
    AC: { L: 0.77, H: 0.44 },
    PR: { N: 0.85, L: 0.62, H: 0.27 }, // Scope Unchanged
    PR_S: { N: 0.85, L: 0.68, H: 0.5 }, // Scope Changed
    UI: { N: 0.85, R: 0.62 },
    S: { U: 'Unchanged', C: 'Changed' },
    C: { H: 0.56, L: 0.22, N: 0 },
    I: { H: 0.56, L: 0.22, N: 0 },
    A: { H: 0.56, L: 0.22, N: 0 }
};

const LABELS: any = {
    AV: { name: 'Attack Vector', options: { N: 'Network', A: 'Adjacent', L: 'Local', P: 'Physical' } },
    AC: { name: 'Attack Complexity', options: { L: 'Low', H: 'High' } },
    PR: { name: 'Privileges Required', options: { N: 'None', L: 'Low', H: 'High' } },
    UI: { name: 'User Interaction', options: { N: 'None', R: 'Required' } },
    S: { name: 'Scope', options: { U: 'Unchanged', C: 'Changed' } },
    C: { name: 'Confidentiality', options: { H: 'High', L: 'Low', N: 'None' } },
    I: { name: 'Integrity', options: { H: 'High', L: 'Low', N: 'None' } },
    A: { name: 'Availability', options: { H: 'High', L: 'Low', N: 'None' } },
};

interface Props {
    initialVector?: string;
    onChange: (score: string, vector: string) => void;
}

export default function CvssCalculator({ initialVector, onChange }: Props) {
    const [vector, setVector] = useState({
        AV: 'N', AC: 'L', PR: 'N', UI: 'N', S: 'U', C: 'H', I: 'H', A: 'H'
    });
    const [score, setScore] = useState('0.0');

    useEffect(() => {
        if (initialVector && initialVector.startsWith('CVSS:3.1/')) {
            const parts = initialVector.substring(9).split('/');
            const newVector: any = { ...vector };
            parts.forEach(part => {
                const [key, val] = part.split(':');
                if (key && val && LABELS[key]) newVector[key] = val;
            });
            setVector(newVector);
        }
    }, []);

    useEffect(() => {
        const s = calculateScore(vector);
        setScore(s);
        const vectorString = `CVSS:3.1/AV:${vector.AV}/AC:${vector.AC}/PR:${vector.PR}/UI:${vector.UI}/S:${vector.S}/C:${vector.C}/I:${vector.I}/A:${vector.A}`;
        onChange(s, vectorString);
    }, [vector]);

    const calculateScore = (v: any) => {
        // Simplified Logic Scope
        const Scope = v.S === 'U' ? false : true;

        // Impact Sub Score
        const Iss = 1 - ((1 - METRICS.C[v.C as keyof typeof METRICS.C]) * (1 - METRICS.I[v.I as keyof typeof METRICS.I]) * (1 - METRICS.A[v.A as keyof typeof METRICS.A]));

        let Impact = 0;
        if (Scope) {
            Impact = 7.52 * (Iss - 0.029) - 3.25 * Math.pow(Iss - 0.02, 15);
        } else {
            Impact = 6.42 * Iss;
        }

        // Exploitability Sub Score
        const prVal = Scope ? METRICS.PR_S[v.PR as keyof typeof METRICS.PR_S] : METRICS.PR[v.PR as keyof typeof METRICS.PR];
        const Exploitability = 8.22 * METRICS.AV[v.AV as keyof typeof METRICS.AV] * METRICS.AC[v.AC as keyof typeof METRICS.AC] * prVal * METRICS.UI[v.UI as keyof typeof METRICS.UI];

        if (Impact <= 0) return '0.0';

        let BaseScore = 0;
        if (Scope) {
            BaseScore = Math.min(1.08 * (Impact + Exploitability), 10);
        } else {
            BaseScore = Math.min(Impact + Exploitability, 10);
        }

        return Math.ceil(BaseScore * 10) / 10 + "";
    };

    const handleChange = (metric: string, value: string) => {
        setVector(prev => ({ ...prev, [metric]: value }));
    };

    const getColor = (s: number) => {
        if (s === 0) return 'text-slate-400';
        if (s < 4.0) return 'text-green-400';
        if (s < 7.0) return 'text-yellow-400';
        if (s < 9.0) return 'text-orange-400';
        return 'text-red-500 font-bold';
    };

    return (
        <div className="bg-slate-800 p-2 rounded border border-slate-700 text-xs">
            <div className="flex justify-between items-center mb-2 border-b border-slate-600 pb-1">
                <span className="font-bold text-slate-300">CVSS 3.1 Calculator</span>
                <span className={`text-lg ${getColor(parseFloat(score))}`}>{score}</span>
            </div>
            <div className="grid grid-cols-2 gap-x-2 gap-y-1">
                {Object.keys(LABELS).map((key) => (
                    <div key={key} className="flex flex-col">
                        <label className="text-[10px] text-slate-500 uppercase">{LABELS[key].name}</label>
                        <select
                            value={vector[key as keyof typeof vector]}
                            onChange={(e) => handleChange(key, e.target.value)}
                            className="bg-slate-900 border border-slate-700 rounded text-slate-300 px-1 py-0.5"
                        >
                            {Object.entries(LABELS[key].options).map(([optKey, optLabel]: any) => (
                                <option key={optKey} value={optKey}>{optLabel}</option>
                            ))}
                        </select>
                    </div>
                ))}
            </div>
        </div>
    );
}
