'use client';

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { motion } from 'framer-motion';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Card, CardBody, CardHeader } from '../ui/Card';
import { Avatar } from '../ui/Avatar';
import { api } from '../../lib/api';
import { User } from '../../types';

interface RecognitionFormData {
  recipientId: string;
  message: string;
  pointsAmount: number;
  isPrivate: boolean;
}

interface RecognitionFormProps {
  onSuccess?: () => void;
  onCancel?: () => void;
}

export default function RecognitionForm({ onSuccess, onCancel }: RecognitionFormProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<User[]>([]);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    setValue,
    reset,
  } = useForm<RecognitionFormData>();

  const pointsAmount = watch('pointsAmount', 1);

  // Search users
  const searchUsers = async (query: string) => {
    if (query.length < 2) {
      setSearchResults([]);
      return;
    }

    setIsSearching(true);
    try {
      const users = await api.searchUsers(query);
      setSearchResults(users);
    } catch (error) {
      console.error('Error searching users:', error);
    } finally {
      setIsSearching(false);
    }
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;
    setSearchQuery(query);
    searchUsers(query);
  };

  const selectUser = (user: User) => {
    setSelectedUser(user);
    setSearchQuery(`${user.firstName} ${user.lastName}`);
    setSearchResults([]);
    setValue('recipientId', user.id);
  };

  const onSubmit = async (data: RecognitionFormData) => {
    if (!selectedUser) return;

    setIsSubmitting(true);
    try {
      await api.createRecognition(data);
      reset();
      setSelectedUser(null);
      setSearchQuery('');
      onSuccess?.();
    } catch (error) {
      console.error('Error sending recognition:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card variant="shadow" className="max-w-2xl mx-auto">
      <CardHeader>
        <div className="flex items-center justify-between">
          <h3 className="text-xl font-semibold text-default-900">
            Send Recognition
          </h3>
          {onCancel && (
            <Button
              variant="light"
              size="sm"
              onClick={onCancel}
            >
              Cancel
            </Button>
          )}
        </div>
      </CardHeader>
      
      <CardBody>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* User Search */}
          <div className="relative">
            <Input
              label="Select Colleague"
              placeholder="Search by name or department..."
              value={searchQuery}
              onChange={handleSearchChange}
              variant="bordered"
              startContent={
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinecap="round" strokeWidth={2} d="m21 21-6-6m2-5a7 7 0 1 1-14 0 7 7 0 0 1 14 0Z" />
                </svg>
              }
              isRequired
              errorMessage={errors.recipientId?.message}
            />
            
            {/* Search Results */}
            {searchResults.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="absolute z-10 w-full mt-2 bg-white border border-default-200 rounded-lg shadow-lg max-h-60 overflow-y-auto"
              >
                {searchResults.map((user) => (
                  <motion.div
                    key={user.id}
                    whileHover={{ backgroundColor: '#f1f3f4' }}
                    onClick={() => selectUser(user)}
                    className="flex items-center gap-3 p-3 cursor-pointer hover:bg-default-100"
                  >
                    <Avatar
                      src={user.avatarUrl}
                      name={`${user.firstName} ${user.lastName}`}
                      size="sm"
                    />
                    <div>
                      <p className="font-medium text-default-900">
                        {user.firstName} {user.lastName}
                      </p>
                      <p className="text-sm text-default-600">{user.department}</p>
                    </div>
                  </motion.div>
                ))}
              </motion.div>
            )}
            
            {isSearching && (
              <div className="absolute right-3 top-1/2 -translate-y-1/2">
                <div className="w-4 h-4 animate-spin rounded-full border-2 border-primary-500 border-t-transparent" />
              </div>
            )}
          </div>

          {/* Selected User Display */}
          {selectedUser && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="p-4 bg-primary-50 rounded-lg border border-primary-200"
            >
              <div className="flex items-center gap-3">
                <Avatar
                  src={selectedUser.avatarUrl}
                  name={`${selectedUser.firstName} ${selectedUser.lastName}`}
                  size="md"
                />
                <div>
                  <p className="font-semibold text-primary-900">
                    {selectedUser.firstName} {selectedUser.lastName}
                  </p>
                  <p className="text-sm text-primary-700">{selectedUser.department}</p>
                </div>
              </div>
            </motion.div>
          )}

          {/* Message */}
          <div>
            <label className="block text-sm font-medium text-default-700 mb-2">
              Recognition Message *
            </label>
            <textarea
              {...register('message', { 
                required: 'Message is required',
                maxLength: { value: 500, message: 'Message must be less than 500 characters' }
              })}
              placeholder="Write a thoughtful message about their contribution..."
              className="w-full px-3 py-2 border border-default-200 rounded-lg focus:border-primary-500 focus:ring-2 focus:ring-primary-500 focus:ring-opacity-20 transition-colors resize-none"
              rows={4}
            />
            {errors.message && (
              <p className="text-xs text-danger-500 mt-1">{errors.message.message}</p>
            )}
          </div>

          {/* Points */}
          <div>
            <label className="block text-sm font-medium text-default-700 mb-2">
              Points to Award
            </label>
            <div className="flex items-center gap-4">
              <input
                {...register('pointsAmount', {
                  required: 'Points amount is required',
                  min: { value: 1, message: 'Minimum 1 point' },
                  max: { value: 100, message: 'Maximum 100 points' }
                })}
                type="range"
                min="1"
                max="100"
                className="flex-1 h-2 bg-default-200 rounded-lg appearance-none cursor-pointer"
              />
              <div className="flex items-center gap-2 min-w-fit">
                <span className="text-2xl font-bold text-primary-600">{pointsAmount}</span>
                <span className="text-sm text-default-600">points</span>
              </div>
            </div>
            {errors.pointsAmount && (
              <p className="text-xs text-danger-500 mt-1">{errors.pointsAmount.message}</p>
            )}
          </div>

          {/* Privacy Option */}
          <div className="flex items-center gap-3">
            <input
              {...register('isPrivate')}
              type="checkbox"
              id="isPrivate"
              className="w-4 h-4 text-primary-600 border-default-300 rounded focus:ring-primary-500"
            />
            <label htmlFor="isPrivate" className="text-sm text-default-700">
              Keep this recognition private
            </label>
          </div>

          {/* Submit Button */}
          <div className="flex gap-3 pt-4">
            <Button
              type="submit"
              variant="primary"
              size="lg"
              isDisabled={!selectedUser || isSubmitting}
              isLoading={isSubmitting}
              className="flex-1"
            >
              {isSubmitting ? 'Sending...' : 'Send Recognition'}
            </Button>
          </div>
        </form>
      </CardBody>
    </Card>
  );
}