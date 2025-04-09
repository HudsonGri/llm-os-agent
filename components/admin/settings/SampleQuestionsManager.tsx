'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { 
  DndContext, 
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { 
  GripVertical, 
  Trash2, 
  Plus, 
  Save, 
  RefreshCw, 
  ArrowLeftRight,
  Pencil
} from 'lucide-react';
import { cn } from '@/lib/utils';

// Define types
interface SampleQuestion {
  id?: number;
  question: string;
  category?: string;
  position: number;
  isActive: number;
}

interface BankQuestion {
  id: number;
  question: string;
  category: string;
  position: number;
  isActive: number;
}

// Sortable item component
const SortableQuestionItem = ({ 
  question, 
  onDelete, 
  onEdit 
}: { 
  question: SampleQuestion; 
  onDelete: () => void;
  onEdit: (updatedQuestion: string) => void;
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(question.question);
  
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
  } = useSortable({ id: question.id?.toString() || `new-${question.position}` });
  
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };
  
  const handleSaveEdit = () => {
    if (editValue.trim()) {
      onEdit(editValue.trim());
      setIsEditing(false);
    }
  };
  
  return (
    <div 
      ref={setNodeRef} 
      style={style} 
      className="flex items-center gap-3 p-3 mb-2 bg-white border rounded-md shadow-sm"
    >
      <button
        type="button"
        className="p-1 cursor-grab text-gray-400 hover:text-gray-500"
        {...attributes}
        {...listeners}
      >
        <GripVertical size={20} />
      </button>
      
      {isEditing ? (
        <div className="flex-1 flex gap-2">
          <Input 
            value={editValue} 
            onChange={(e) => setEditValue(e.target.value)} 
            className="flex-1"
            onKeyDown={(e) => e.key === 'Enter' && handleSaveEdit()}
            autoFocus
          />
          <Button size="sm" onClick={handleSaveEdit}>Save</Button>
          <Button 
            size="sm" 
            variant="outline" 
            onClick={() => {
              setEditValue(question.question);
              setIsEditing(false);
            }}
          >
            Cancel
          </Button>
        </div>
      ) : (
        <>
          <span className="flex-1" onDoubleClick={() => setIsEditing(true)}>
            {question.question}
          </span>
          <Button 
            size="icon" 
            variant="ghost" 
            onClick={() => setIsEditing(true)}
            className="h-8 w-8"
          >
            <Pencil size={16} />
          </Button>
          <Button 
            size="icon" 
            variant="ghost" 
            onClick={onDelete}
            className="h-8 w-8 text-red-500 hover:text-red-600"
          >
            <Trash2 size={16} />
          </Button>
        </>
      )}
    </div>
  );
};

export function SampleQuestionsManager() {
  // State for the currently active questions
  const [activeQuestions, setActiveQuestions] = useState<SampleQuestion[]>([]);
  
  // Keep a reference to the original questions for comparison
  const [originalQuestions, setOriginalQuestions] = useState<SampleQuestion[]>([]);
  
  // Track if there are unsaved changes
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  
  // State for the bank of suggested questions, now grouped by category
  const [suggestedQuestionsByCategory, setSuggestedQuestionsByCategory] = useState<Record<string, BankQuestion[]>>({});
  
  // State for the new question input
  const [newQuestion, setNewQuestion] = useState('');
  
  // Loading states
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isBankLoading, setIsBankLoading] = useState(true);
  
  // Set up DnD sensors
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );
  
  // Check if there are actual changes compared to original state
  const checkForUnsavedChanges = useCallback((currentQuestions: SampleQuestion[]) => {
    // If lengths are different, there are changes
    if (currentQuestions.length !== originalQuestions.length) {
      setHasUnsavedChanges(true);
      return;
    }
    
    // Compare each question - order matters
    for (let i = 0; i < currentQuestions.length; i++) {
      const current = currentQuestions[i];
      const original = originalQuestions[i];
      
      // Check if any property is different
      if (
        current.question !== original.question ||
        current.position !== i || // Use index as position for comparison
        current.isActive !== original.isActive
      ) {
        setHasUnsavedChanges(true);
        return;
      }
    }
    
    // No changes found
    setHasUnsavedChanges(false);
  }, [originalQuestions]);
  
  // Fetch question bank from the API
  const fetchQuestionBank = useCallback(async () => {
    try {
      setIsBankLoading(true);
      const response = await fetch('/api/admin/sample-questions-bank');
      
      if (!response.ok) {
        throw new Error('Failed to fetch questions bank');
      }
      
      const data = await response.json();
      
      if (data.bankItems && Array.isArray(data.bankItems)) {
        // Group questions by category
        const groupedQuestions: Record<string, BankQuestion[]> = {};
        
        for (const item of data.bankItems) {
          if (!groupedQuestions[item.category]) {
            groupedQuestions[item.category] = [];
          }
          groupedQuestions[item.category].push(item);
        }
        
        // Sort items within each category by position
        Object.keys(groupedQuestions).forEach(category => {
          groupedQuestions[category].sort((a, b) => a.position - b.position);
        });
        
        setSuggestedQuestionsByCategory(groupedQuestions);
      }
    } catch (error) {
      console.error('Error fetching questions bank:', error);
      toast.error('Failed to load questions bank');
      
      // Empty state instead of fallback
      setSuggestedQuestionsByCategory({});
    } finally {
      setIsBankLoading(false);
    }
  }, []);
  
  // Load questions from the API
  const fetchQuestions = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/admin/sample-questions');
      
      if (!response.ok) {
        throw new Error('Failed to fetch questions');
      }
      
      const data = await response.json();
      
      if (data.questions && Array.isArray(data.questions)) {
        const activeQs = data.questions.filter((q: any) => q.isActive === 1);
        setActiveQuestions(activeQs);
        setOriginalQuestions(JSON.parse(JSON.stringify(activeQs))); // Deep copy
        setHasUnsavedChanges(false);
        
        // Also fetch the questions bank
        await fetchQuestionBank();
      }
    } catch (error) {
      console.error('Error fetching sample questions:', error);
      toast.error('Failed to load sample questions');
    } finally {
      setIsLoading(false);
    }
  }, [fetchQuestionBank]);
  
  // Save questions to the API
  const saveQuestions = async () => {
    try {
      setIsSaving(true);
      
      // Ensure positions are correctly set and categories are not null
      const questionsToSave = activeQuestions.map((q, index) => ({
        ...q,
        position: index,
        category: q.category || "General" // Ensure category is never null
      }));
      
      const response = await fetch('/api/admin/sample-questions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          questions: questionsToSave,
        }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to save questions');
      }
      
      toast.success('Sample questions saved successfully');
      
      // Update original questions reference after successful save
      setOriginalQuestions(JSON.parse(JSON.stringify(questionsToSave)));
      setHasUnsavedChanges(false);
    } catch (error) {
      console.error('Error saving sample questions:', error);
      toast.error('Failed to save sample questions');
    } finally {
      setIsSaving(false);
    }
  };
  
  // Load questions on component mount
  useEffect(() => {
    fetchQuestions();
  }, [fetchQuestions]);
  
  // Handle drag end event
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    
    if (over && active.id !== over.id) {
      setActiveQuestions((items) => {
        const oldIndex = items.findIndex(
          (item) => (item.id?.toString() || `new-${item.position}`) === active.id
        );
        const newIndex = items.findIndex(
          (item) => (item.id?.toString() || `new-${item.position}`) === over.id
        );
        
        const newItems = arrayMove(items, oldIndex, newIndex);
        // Check if this caused actual changes
        checkForUnsavedChanges(newItems);
        return newItems;
      });
    }
  };
  
  // Add a new question
  const addQuestion = (text: string) => {
    if (!text.trim()) return;
    
    const newItem: SampleQuestion = {
      question: text.trim(),
      category: "General", // Always provide a default category
      position: activeQuestions.length,
      isActive: 1,
    };
    
    const newQuestions = [...activeQuestions, newItem];
    setActiveQuestions(newQuestions);
    setNewQuestion('');
    
    // Check for changes
    checkForUnsavedChanges(newQuestions);
  };
  
  // Add a bank question to active questions
  const addBankQuestion = (bankQuestion: BankQuestion) => {
    const newItem: SampleQuestion = {
      question: bankQuestion.question,
      category: bankQuestion.category,
      position: activeQuestions.length,
      isActive: 1,
    };
    
    const newQuestions = [...activeQuestions, newItem];
    setActiveQuestions(newQuestions);
    
    // Check for changes
    checkForUnsavedChanges(newQuestions);
  };
  
  // Delete a question
  const deleteQuestion = (index: number) => {
    const questionToRemove = activeQuestions[index];
    
    // Remove from active questions
    const newQuestions = activeQuestions.filter((_, i) => i !== index);
    setActiveQuestions(newQuestions);
    
    // Check for changes
    checkForUnsavedChanges(newQuestions);
  };
  
  // Edit a question
  const editQuestion = (index: number, newText: string) => {
    // Skip if text hasn't changed
    if (activeQuestions[index].question === newText) return;
    
    const updatedQuestions = [...activeQuestions];
    updatedQuestions[index] = {
      ...updatedQuestions[index],
      question: newText
    };
    setActiveQuestions(updatedQuestions);
    
    // Check for changes
    checkForUnsavedChanges(updatedQuestions);
  };
  
  // Check if a question is already in active questions
  const isQuestionActive = useCallback((questionText: string): boolean => {
    return activeQuestions.some(q => 
      q.question.toLowerCase() === questionText.toLowerCase()
    );
  }, [activeQuestions]);
  
  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <CardTitle>Sample Questions</CardTitle>
            {hasUnsavedChanges && (
              <div className="flex items-center">
                <div className="h-2 w-2 rounded-full bg-amber-500 mr-1.5"></div>
                <span className="text-xs text-amber-500 font-medium">
                  Unsaved changes
                </span>
              </div>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={fetchQuestions}
              disabled={isLoading}
              className="h-8 flex items-center gap-1.5"
            >
              <RefreshCw size={14} className={cn(isLoading && "animate-spin")} />
              <span>Refresh</span>
            </Button>
            <Button
              size="sm"
              onClick={saveQuestions}
              disabled={isSaving || isLoading || !hasUnsavedChanges}
              className="h-8 flex items-center gap-1.5"
            >
              <Save size={14} />
              <span>{isSaving ? 'Saving...' : 'Save'}</span>
            </Button>
          </div>
        </div>
      </CardHeader>
      
      <CardContent>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Active questions section */}
          <div>
            <div className="mb-4">
              <Label htmlFor="new-question" className="mb-2 block">Add New Question</Label>
              <div className="flex gap-2">
                <Input
                  id="new-question"
                  placeholder="Type a new question..."
                  value={newQuestion}
                  onChange={(e) => setNewQuestion(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && addQuestion(newQuestion)}
                />
                <Button onClick={() => addQuestion(newQuestion)}>
                  <Plus size={16} className="mr-2" />
                  Add
                </Button>
              </div>
            </div>
            
            <h3 className="text-sm font-medium mb-3 flex items-center">
              Active Questions 
              <Badge variant="secondary" className="ml-2">
                {activeQuestions.length}
              </Badge>
              <span className="ml-2 text-xs text-gray-500">
                (drag to reorder)
              </span>
            </h3>
            
            {isLoading ? (
              <div className="space-y-2">
                {[1, 2, 3].map((i) => (
                  <div 
                    key={i} 
                    className="h-12 bg-gray-100 animate-pulse rounded-md"
                  />
                ))}
              </div>
            ) : activeQuestions.length === 0 ? (
              <div className="text-center p-4 border border-dashed rounded-md bg-gray-50">
                <p className="text-gray-500">No active questions yet</p>
                <p className="text-sm text-gray-400 mt-1">
                  Add questions from the suggested bank or create your own
                </p>
              </div>
            ) : (
              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleDragEnd}
              >
                <SortableContext
                  items={activeQuestions.map(q => q.id?.toString() || `new-${q.position}`)}
                  strategy={verticalListSortingStrategy}
                >
                  <div className="space-y-2">
                    {activeQuestions.map((question, index) => (
                      <SortableQuestionItem
                        key={question.id?.toString() || `new-${question.position}`}
                        question={question}
                        onDelete={() => deleteQuestion(index)}
                        onEdit={(updatedQuestion) => editQuestion(index, updatedQuestion)}
                      />
                    ))}
                  </div>
                </SortableContext>
              </DndContext>
            )}
          </div>
          
          {/* Suggested questions bank - now grouped by category */}
          <div>
            <h3 className="text-sm font-medium mb-3 flex items-center">
              Suggested Questions Bank 
              <Badge variant="secondary" className="ml-2">
                {Object.values(suggestedQuestionsByCategory).reduce(
                  (sum, questions) => sum + questions.length, 0
                )}
              </Badge>
            </h3>
            
            {isBankLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i}>
                    <div className="h-6 w-1/4 bg-gray-100 animate-pulse rounded-md mb-2" />
                    <div className="space-y-2">
                      {[1, 2].map((j) => (
                        <div key={j} className="h-12 bg-gray-100 animate-pulse rounded-md" />
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            ) : Object.keys(suggestedQuestionsByCategory).length === 0 ? (
              <div className="text-center p-4 border border-dashed rounded-md bg-gray-50">
                <p className="text-gray-500">No suggestion bank questions available</p>
                <p className="text-sm text-gray-400 mt-1">
                  Contact an administrator to add questions to the bank
                </p>
              </div>
            ) : (
              <div className="space-y-6 max-h-[500px] overflow-y-auto pr-2">
                {/* Loop through each category */}
                {Object.entries(suggestedQuestionsByCategory).map(([category, questions]) => (
                  <div key={category}>
                    <h4 className="text-sm font-medium text-gray-700 mb-2 flex items-center">
                      {category}
                      <Badge variant="outline" className="ml-2 bg-gray-100">
                        {questions.length}
                      </Badge>
                    </h4>
                    <div className="space-y-2 ml-1">
                      {questions.map((question) => {
                        const alreadyActive = isQuestionActive(question.question);
                        return (
                          <div
                            key={question.id}
                            className={cn(
                              "p-3 border rounded-md flex items-center gap-2 transition-all",
                              alreadyActive ? 
                                "bg-gray-50 opacity-50" : 
                                "hover:bg-gray-50"
                            )}
                          >
                            <span className="flex-1">{question.question}</span>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => addBankQuestion(question)}
                              disabled={alreadyActive}
                              className="flex items-center gap-1.5"
                            >
                              <ArrowLeftRight size={14} />
                              <span>{alreadyActive ? 'Added' : 'Use'}</span>
                            </Button>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
} 