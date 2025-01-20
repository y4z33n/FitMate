'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Session } from 'next-auth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface CustomSession extends Session {
  user: {
    id: string;
    name?: string | null;
    email?: string | null;
    image?: string | null;
  }
}

interface UserProfile {
  name: string;
  age: number;
  weight: number;
  height: number;
  fitnessGoals: string[];
  fitnessLevel: string;
  medicalConditions: string;
  dietaryRestrictions: string;
  workoutPreferences: string;
  equipmentAccess: string[];
  availableTime: number;
}

const fitnessGoalsOptions = [
  'Weight Loss',
  'Muscle Gain',
  'Endurance',
  'Flexibility',
  'General Fitness',
  'Strength Training'
];

const equipmentOptions = [
  'None',
  'Dumbbells',
  'Resistance Bands',
  'Yoga Mat',
  'Pull-up Bar',
  'Gym Membership'
];

export default function ProfilePage() {
  const router = useRouter();
  const { data: session } = useSession() as { data: CustomSession | null };
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  const [profile, setProfile] = useState<UserProfile>({
    name: '',
    age: 0,
    weight: 0,
    height: 0,
    fitnessGoals: [],
    fitnessLevel: 'Beginner',
    medicalConditions: '',
    dietaryRestrictions: '',
    workoutPreferences: '',
    equipmentAccess: [],
    availableTime: 30
  });

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const response = await fetch('/api/user-profile');
        if (response.ok) {
          const data = await response.json();
          setProfile(data);
        } else {
          const errorText = await response.text();
          console.error('Failed to fetch profile:', errorText);
          setMessage({ type: 'error', text: 'Failed to fetch profile data' });
        }
      } catch (err) {
        console.error('Error fetching profile:', err);
        setMessage({ type: 'error', text: 'Failed to fetch profile data' });
      } finally {
        setIsLoading(false);
      }
    };

    if (session?.user) {
      fetchProfile();
    }
  }, [session]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setMessage(null);

    try {
      const response = await fetch('/api/user-profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(profile),
      });

      if (response.ok) {
        setMessage({ type: 'success', text: 'Profile updated successfully!' });
        setTimeout(() => router.push('/'), 1500);
      } else {
        throw new Error('Failed to update profile');
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to update profile. Please try again.' });
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="w-5 h-5 border-2 border-white rounded-full border-t-transparent animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto py-8 px-4">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold tracking-wide mb-2">Your Profile</h1>
          <p className="text-muted-foreground">Customize your fitness journey</p>
        </div>

        {message && (
          <Card className={cn(
            "mb-6",
            message.type === 'success' ? "bg-green-500/10 text-green-500" : "bg-destructive/10 text-destructive"
          )}>
            <CardContent className="text-center py-4">
              {message.text}
            </CardContent>
          </Card>
        )}

        <form onSubmit={handleSubmit} className="space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Basic Information */}
            <Card>
              <CardHeader>
                <CardTitle>Basic Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Name</label>
                  <input
                    type="text"
                    value={profile.name}
                    onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                    className="w-full px-4 py-2 rounded-lg bg-muted border text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Age</label>
                  <input
                    type="number"
                    value={profile.age || ''}
                    onChange={(e) => setProfile({ ...profile, age: parseInt(e.target.value) || 0 })}
                    className="w-full px-4 py-2 rounded-lg bg-muted border text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Weight (kg)</label>
                  <input
                    type="number"
                    value={profile.weight || ''}
                    onChange={(e) => setProfile({ ...profile, weight: parseInt(e.target.value) || 0 })}
                    className="w-full px-4 py-2 rounded-lg bg-muted border text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Height (cm)</label>
                  <input
                    type="number"
                    value={profile.height || ''}
                    onChange={(e) => setProfile({ ...profile, height: parseInt(e.target.value) || 0 })}
                    className="w-full px-4 py-2 rounded-lg bg-muted border text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                    required
                  />
                </div>
              </CardContent>
            </Card>

            {/* Fitness Goals & Equipment */}
            <Card>
              <CardHeader>
                <CardTitle>Goals & Equipment</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Fitness Goals</label>
                  <div className="grid grid-cols-2 gap-2">
                    {fitnessGoalsOptions.map((goal) => (
                      <label key={goal} className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          checked={profile.fitnessGoals.includes(goal)}
                          onChange={(e) => {
                            const goals = e.target.checked
                              ? [...profile.fitnessGoals, goal]
                              : profile.fitnessGoals.filter(g => g !== goal);
                            setProfile({ ...profile, fitnessGoals: goals });
                          }}
                          className="rounded border-input bg-muted text-primary focus:ring-ring"
                        />
                        <span className="text-sm">{goal}</span>
                      </label>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Fitness Level</label>
                  <select
                    value={profile.fitnessLevel}
                    onChange={(e) => setProfile({ ...profile, fitnessLevel: e.target.value })}
                    className="w-full px-4 py-2 rounded-lg bg-muted border text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                  >
                    <option value="Beginner">Beginner</option>
                    <option value="Intermediate">Intermediate</option>
                    <option value="Advanced">Advanced</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Available Equipment</label>
                  <div className="grid grid-cols-2 gap-2">
                    {equipmentOptions.map((equipmentItem) => (
                      <label key={equipmentItem} className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          checked={profile.equipmentAccess.includes(equipmentItem)}
                          onChange={(e) => {
                            const updatedEquipment = e.target.checked
                              ? [...profile.equipmentAccess, equipmentItem]
                              : profile.equipmentAccess.filter(eq => eq !== equipmentItem);
                            setProfile({ ...profile, equipmentAccess: updatedEquipment });
                          }}
                          className="rounded border-input bg-muted text-primary focus:ring-ring"
                        />
                        <span className="text-sm">{equipmentItem}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Additional Information */}
            <Card className="md:col-span-2">
              <CardHeader>
                <CardTitle>Additional Information</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Medical Conditions</label>
                    <textarea
                      value={profile.medicalConditions}
                      onChange={(e) => setProfile({ ...profile, medicalConditions: e.target.value })}
                      className="w-full px-4 py-2 rounded-lg bg-muted border text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                      rows={3}
                      placeholder="List any medical conditions..."
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Dietary Restrictions</label>
                    <textarea
                      value={profile.dietaryRestrictions}
                      onChange={(e) => setProfile({ ...profile, dietaryRestrictions: e.target.value })}
                      className="w-full px-4 py-2 rounded-lg bg-muted border text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                      rows={3}
                      placeholder="List any dietary restrictions..."
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium mb-1">Workout Preferences</label>
                    <textarea
                      value={profile.workoutPreferences}
                      onChange={(e) => setProfile({ ...profile, workoutPreferences: e.target.value })}
                      className="w-full px-4 py-2 rounded-lg bg-muted border text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                      rows={3}
                      placeholder="Describe your workout preferences..."
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium mb-1">
                      Available Time for Workouts (minutes per session)
                    </label>
                    <input
                      type="number"
                      value={profile.availableTime}
                      onChange={(e) => setProfile({ ...profile, availableTime: parseInt(e.target.value) || 30 })}
                      className="w-full px-4 py-2 rounded-lg bg-muted border text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                      min="15"
                      max="180"
                      step="15"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="flex justify-end space-x-4">
            <Button
              type="button"
              variant="ghost"
              onClick={() => router.push('/')}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSaving}
            >
              {isSaving ? (
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 border-2 border-current rounded-full border-t-transparent animate-spin"></div>
                  <span>Saving...</span>
                </div>
              ) : (
                'Save Changes'
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
} 