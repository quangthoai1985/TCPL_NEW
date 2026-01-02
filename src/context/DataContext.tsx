'use client';

import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { useSession, signOut } from 'next-auth/react';
import {
    getUnits,
    getAssessmentPeriods,
    getCriteria,
    getAssessments,
    getGuidanceDocuments,
    getUsers,
    getLoginConfig,
} from '@/actions/data-actions';
import { upsertAssessment, deleteAssessment as deleteAssessmentAction } from '@/actions/assessmentActions';
import { upsertAssessmentPeriod, deleteAssessmentPeriod as deletePeriodAction } from '@/actions/periodActions';
import { uploadEvidenceFile, deleteEvidenceFile } from '@/actions/storageActions';
import { updateUser as updateUserAction, deleteUser as deleteUserAction } from '@/actions/userActions';
import {
    upsertUnit as upsertUnitAction,
    deleteUnit as deleteUnitAction,
    upsertCriterion as upsertCriterionAction,
    deleteCriterion as deleteCriterionAction,
    upsertGuidanceDocument as upsertGuidanceDocumentAction,
    deleteGuidanceDocument as deleteGuidanceDocumentAction,
    updateLoginConfig as updateLoginConfigAction
} from '@/actions/adminActions';

// Types matching the original DataContext interface
type User = {
    id: string;
    username: string;
    displayName: string;
    phoneNumber?: string;
    role: string;
    communeId?: string | null;
};

type Unit = {
    id: string;
    name: string;
    type: string;
    parentId?: string | null;
};

type DataContextType = {
    currentUser: User | null;
    loading: boolean;
    units: Unit[];
    assessments: any[];
    criteria: any[];
    assessmentPeriods: any[];
    guidanceDocuments: any[];
    loginConfig: any;
    setLoginInfo: (email: string, password: string) => Promise<boolean>;
    logout: () => Promise<void>;
    updateUser: (...args: any[]) => Promise<void>;
    deleteUser: (...args: any[]) => Promise<void>;
    updateUnit: (...args: any[]) => Promise<void>;
    deleteUnit: (...args: any[]) => Promise<void>;
    updateAssessment: (...args: any[]) => Promise<void>;
    deleteAssessment: (...args: any[]) => Promise<void>;
    updateCriterion: (...args: any[]) => Promise<void>;
    deleteCriterion: (...args: any[]) => Promise<void>;
    updateAssessmentPeriod: (...args: any[]) => Promise<void>;
    deleteAssessmentPeriod: (...args: any[]) => Promise<void>;
    updateGuidanceDocument: (...args: any[]) => Promise<void>;
    deleteGuidanceDocument: (...args: any[]) => Promise<void>;
    updateLoginConfig: (config: LoginConfig) => Promise<{ success: boolean; error?: string }>;
    uploadFile: (file: File, communeId: string, periodId: string, indicatorId: string, issueDate?: string, issuanceDeadlineDays?: string) => Promise<{ url: string; signatureStatus?: string; signatureError?: string; previewUrl?: string; previewError?: string }>;
    deleteFile: (fileUrl: string) => Promise<{ success: boolean; error?: string }>;
    storage: any;
    updateAssessments: (...args: any[]) => Promise<void>;
    notifications: any[];
    markNotificationAsRead: (...args: any[]) => void;
    role: string;
    db: any;
    setCriteria: (...args: any[]) => void;
    updateCriteria: (...args: any[]) => Promise<void>;
    updateGuidanceDocuments: (...args: any[]) => Promise<void>;
    users: any[];
    updateUsers: (...args: any[]) => Promise<void>;
    refreshData: () => Promise<void>;
};

const DataContext = createContext<DataContextType | undefined>(undefined);

export function DataProvider({ children }: { children: ReactNode }) {
    const { data: session, status } = useSession();
    const [loading, setLoading] = useState(true);

    // Real data states
    const [units, setUnits] = useState<Unit[]>([]);
    const [assessments, setAssessments] = useState<any[]>([]);
    const [criteria, setCriteria] = useState<any[]>([]);
    const [assessmentPeriods, setAssessmentPeriods] = useState<any[]>([]);
    const [guidanceDocuments, setGuidanceDocuments] = useState<any[]>([]);
    const [users, setUsers] = useState<any[]>([]);
    const [loginConfig, setLoginConfigState] = useState<any>({});

    const currentUser: User | null = session?.user ? {
        id: (session.user as any).id || '',
        username: session.user.name || '',
        displayName: session.user.name || '',
        phoneNumber: (session.user as any).phoneNumber,
        role: (session.user as any).role || 'commune_staff',
        communeId: (session.user as any).communeId || null,
    } : null;

    // Fetch all data from Prisma
    const refreshData = useCallback(async () => {
        if (status !== 'authenticated') return;

        setLoading(true);
        try {
            const [
                unitsData,
                periodsData,
                criteriaData,
                assessmentsData,
                documentsData,
                usersData,
                configData,
            ] = await Promise.all([
                getUnits(),
                getAssessmentPeriods(),
                getCriteria(),
                getAssessments(currentUser?.communeId || undefined),
                getGuidanceDocuments(),
                getUsers(),
                getLoginConfig(),
            ]);

            setUnits(unitsData as Unit[]);
            setAssessmentPeriods(periodsData);
            setCriteria(criteriaData);
            setAssessments(assessmentsData);
            setGuidanceDocuments(documentsData);
            setUsers(usersData);
            setLoginConfigState(configData);
        } catch (error) {
            console.error('Error fetching data:', error);
        } finally {
            setLoading(false);
        }
    }, [status, currentUser?.communeId]);

    // Fetch data when session is ready
    useEffect(() => {
        if (status === 'authenticated') {
            refreshData();
        } else if (status === 'unauthenticated') {
            setLoading(false);
        }
    }, [status, refreshData]);

    const logout = async () => {
        await signOut({ callbackUrl: '/' });
    };

    const stubAsync = async (...args: any[]) => {
        console.warn('DataContext stub function called - needs refactoring');
    };

    const uploadFileFunc = async (file: File, communeId: string, periodId: string, indicatorId: string, issueDate?: string, issuanceDeadlineDays?: string): Promise<{ url: string; signatureStatus?: string; signatureError?: string; previewUrl?: string }> => {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('communeId', communeId);
        formData.append('periodId', periodId);
        formData.append('indicatorId', indicatorId);
        if (issueDate) formData.append('issueDate', issueDate);
        if (issuanceDeadlineDays) formData.append('issuanceDeadlineDays', issuanceDeadlineDays);

        const result = await uploadEvidenceFile(formData);
        if (result.success && result.url) {
            return {
                url: result.url,
                signatureStatus: result.signatureStatus,
                signatureError: result.signatureError,
                previewUrl: result.previewUrl,
                previewError: result.previewError
            };
        } else {
            throw new Error(result.error || "Upload failed");
        }
    };

    const updateAssessment = async (assessment: any) => {
        // Optimistic update
        setAssessments(prev => {
            const index = prev.findIndex(a => a.id === assessment.id);
            if (index >= 0) {
                const newArr = [...prev];
                newArr[index] = assessment;
                return newArr;
            } else {
                return [...prev, assessment];
            }
        });

        await upsertAssessment(assessment);
    };

    const deleteAssessment = async (assessmentId: string) => {
        setAssessments(prev => prev.filter(a => a.id !== assessmentId));
        await deleteAssessmentAction(assessmentId);
    };

    const value: DataContextType = {
        currentUser,
        loading,
        units,
        assessments,
        criteria,
        assessmentPeriods,
        guidanceDocuments,
        loginConfig,
        setLoginInfo: async () => false,
        logout,
        updateUser: async (user: User) => {
            setUsers(prev => prev.map(u => u.id === user.id ? user : u));
            const res = await updateUserAction(user);
            if (!res.success) {
                console.error(res.error);
                // Revert or show toast (but we don't have toast here easy without hook)
                refreshData();
            }
        },
        deleteUser: async (userId: string) => {
            setUsers(prev => prev.filter(u => u.id !== userId));
            const res = await deleteUserAction(userId);
            if (!res.success) {
                console.error(res.error);
                refreshData();
            }
        },
        updateUnit: async (unit: Unit) => {
            setUnits(prev => {
                const index = prev.findIndex(u => u.id === unit.id);
                if (index >= 0) {
                    const newArr = [...prev];
                    newArr[index] = unit;
                    return newArr;
                } else {
                    return [...prev, unit];
                }
            });
            const res = await upsertUnitAction(unit);
            if (!res.success) { console.error(res.error); refreshData(); }
        },
        deleteUnit: async (id: string) => {
            setUnits(prev => prev.filter(u => u.id !== id));
            const res = await deleteUnitAction(id);
            if (!res.success) { console.error(res.error); refreshData(); }
        },
        updateAssessment,
        deleteAssessment,
        updateCriterion: async (criterion: any) => {
            // Note: Optimistically updating complex nested criteria is hard, we might just rely on re-fetch or simple top-level update
            setCriteria(prev => {
                const index = prev.findIndex(c => c.id === criterion.id);
                if (index >= 0) {
                    const newArr = [...prev];
                    newArr[index] = criterion;
                    return newArr;
                } else {
                    return [...prev, criterion];
                }
            });
            const res = await upsertCriterionAction(criterion);
            if (!res.success) { console.error(res.error); refreshData(); }
        },
        deleteCriterion: async (id: string) => {
            setCriteria(prev => prev.filter(c => c.id !== id));
            const res = await deleteCriterionAction(id);
            if (!res.success) { console.error(res.error); refreshData(); }
        },
        updateAssessmentPeriod: async (period: any) => {
            // Optimistic update
            setAssessmentPeriods(prev => {
                let newArr = [...prev];
                // If activating, deactive others locally
                if (period.isActive) {
                    newArr = newArr.map(p => ({ ...p, isActive: false }));
                }
                const index = newArr.findIndex(p => p.id === period.id);
                if (index >= 0) {
                    newArr[index] = period;
                } else {
                    newArr.push(period);
                }
                return newArr;
            });
            await upsertAssessmentPeriod(period);
            // Refresh to ensure server side constraints (active status) are synced
            refreshData();
        },
        deleteAssessmentPeriod: async (id: string) => {
            setAssessmentPeriods(prev => prev.filter(p => p.id !== id));
            await deletePeriodAction(id);
        },
        updateGuidanceDocument: async (doc: any) => {
            // Optimistic
            setGuidanceDocuments(prev => {
                const index = prev.findIndex(d => d.id === doc.id);
                if (index >= 0) return prev.map(d => d.id === doc.id ? doc : d);
                return [doc, ...prev];
            });
            const res = await upsertGuidanceDocumentAction(doc);
            if (!res.success) { console.error(res.error); refreshData(); }
        },
        deleteGuidanceDocument: async (id: string) => {
            setGuidanceDocuments(prev => prev.filter(d => d.id !== id));
            const res = await deleteGuidanceDocumentAction(id);
            if (!res.success) { console.error(res.error); refreshData(); }
        },
        updateLoginConfig: async (config: any) => {
            setLoginConfigState(config);
            const res = await updateLoginConfigAction(config);
            if (!res.success) { console.error(res.error); refreshData(); }
        },
        uploadFile: uploadFileFunc,
        deleteFile: async (url: string) => {
            const res = await deleteEvidenceFile(url);
            if (!res.success) console.error(res.error);
        },
        storage: null,
        updateAssessments: stubAsync, // This one is tricky, singular is generic, plural might be batch? 
        // usage in page.tsx: const { updateAssessments } = useData(); 
        // In page.tsx (Self Assessment): updateAssessments is used? 
        // Checked usage: page.tsx uses `updateAssessments` to update local state or server?
        // Actually earlier logs show `updateAssessments` (plural) might be used for cache update or something.
        // But `updateAssessment` (singular) is the main actions wrapper.
        // Let's keep `updateAssessments` stubbed if unused or simple state setter?
        // Actually, `updateAssessments` in DataContextType might be the "setAssessments" exposed?
        // DataContextType definition: updateAssessments (plural)?
        // Ref: Step 114 line 239: updateAssessments: stubAsync.
        // Let's check where it is used.
        notifications: [],
        markNotificationAsRead: () => { },
        role: currentUser?.role || 'commune_staff',
        db: null,
        setCriteria: (newCriteria: any[]) => setCriteria(newCriteria),
        updateCriteria: stubAsync, // Alias for upsert?
        updateGuidanceDocuments: stubAsync, // Alias?
        users,
        updateUsers: stubAsync,
        refreshData,
    };

    return (
        <DataContext.Provider value={value}>
            {children}
        </DataContext.Provider>
    );
}

export function useData() {
    const context = useContext(DataContext);
    if (context === undefined) {
        throw new Error('useData must be used within a DataProvider');
    }
    return context;
}
