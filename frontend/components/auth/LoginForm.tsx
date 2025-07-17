'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { motion } from 'framer-motion';
import { useAuthStore } from '../../store/authStore';
import { LoginData } from '../../types';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Card, CardBody, CardHeader } from '../ui/Card';

export default function LoginForm() {
  const [showRegister, setShowRegister] = useState(false);
  const { login, isLoading, error, clearError } = useAuthStore();
  const router = useRouter();
  
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginData>();

  const onSubmit = async (data: LoginData) => {
    try {
      clearError();
      await login(data);
      router.push('/dashboard');
    } catch (error) {
      // Error is handled in the store
    }
  };

  if (showRegister) {
    return <RegisterForm onBackToLogin={() => setShowRegister(false)} />;
  }

  return (
    <Card variant="glass" className="w-full max-w-md">
      <CardHeader>
        <div className="text-center">
          <h2 className="text-2xl font-bold text-white">Welcome back</h2>
          <p className="text-gray-200 mt-1">Sign in to your account</p>
        </div>
      </CardHeader>
      
      <CardBody>
        <form className="space-y-6" onSubmit={handleSubmit(onSubmit)}>
          <Input
            {...register('email', {
              required: 'Email is required',
              pattern: {
                value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                message: 'Invalid email address',
              },
            })}
            type="email"
            label="Email"
            placeholder="Enter your email"
            variant="glass"
            errorMessage={errors.email?.message}
            startContent={
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinecap="round" strokeWidth={2} d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
              </svg>
            }
          />
          
          <Input
            {...register('password', {
              required: 'Password is required',
              minLength: {
                value: 6,
                message: 'Password must be at least 6 characters',
              },
            })}
            type="password"
            label="Password"
            placeholder="Enter your password"
            variant="glass"
            errorMessage={errors.password?.message}
            startContent={
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinecap="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            }
          />

          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-3 glass-card bg-red-400 bg-opacity-20 border border-red-300"
            >
              <p className="text-sm text-red-100">{error}</p>
            </motion.div>
          )}

          <Button
            type="submit"
            variant="primary"
            size="lg"
            isLoading={isLoading}
            isDisabled={isLoading}
            className="w-full"
          >
            {isLoading ? 'Signing in...' : 'Sign in'}
          </Button>

          <div className="text-center">
            <button
              type="button"
              onClick={() => setShowRegister(true)}
              className="text-white hover:text-gray-200 text-sm font-medium transition-colors"
            >
              Don't have an account? Register here
            </button>
          </div>
        </form>
      </CardBody>
    </Card>
  );
}

function RegisterForm({ onBackToLogin }: { onBackToLogin: () => void }) {
  const { register: registerUser, isLoading, error, clearError } = useAuthStore();
  const router = useRouter();
  
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<{
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    department: string;
  }>();

  const onSubmit = async (data: any) => {
    try {
      clearError();
      await registerUser(data);
      router.push('/dashboard');
    } catch (error) {
      // Error is handled in the store
    }
  };

  return (
    <Card variant="glass" className="w-full max-w-md">
      <CardHeader>
        <div className="text-center">
          <h2 className="text-2xl font-bold text-white">Create account</h2>
          <p className="text-gray-200 mt-1">Join the team recognition platform</p>
        </div>
      </CardHeader>
      
      <CardBody>
        <form className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
          <div className="grid grid-cols-2 gap-4">
            <Input
              {...register('firstName', { required: 'First name is required' })}
              type="text"
              label="First Name"
              placeholder="John"
              variant="glass"
              errorMessage={errors.firstName?.message}
            />
            
            <Input
              {...register('lastName', { required: 'Last name is required' })}
              type="text"
              label="Last Name"
              placeholder="Doe"
              variant="glass"
              errorMessage={errors.lastName?.message}
            />
          </div>
          
          <Input
            {...register('department', { required: 'Department is required' })}
            type="text"
            label="Department"
            placeholder="Engineering"
            variant="glass"
            errorMessage={errors.department?.message}
            startContent={
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinecap="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            }
          />
          
          <Input
            {...register('email', {
              required: 'Email is required',
              pattern: {
                value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                message: 'Invalid email address',
              },
            })}
            type="email"
            label="Email"
            placeholder="john.doe@company.com"
            variant="glass"
            errorMessage={errors.email?.message}
            startContent={
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinecap="round" strokeWidth={2} d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
              </svg>
            }
          />
          
          <Input
            {...register('password', {
              required: 'Password is required',
              minLength: {
                value: 6,
                message: 'Password must be at least 6 characters',
              },
            })}
            type="password"
            label="Password"
            placeholder="Create a secure password"
            variant="glass"
            errorMessage={errors.password?.message}
            startContent={
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinecap="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            }
          />

          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-3 glass-card bg-red-400 bg-opacity-20 border border-red-300"
            >
              <p className="text-sm text-red-100">{error}</p>
            </motion.div>
          )}

          <Button
            type="submit"
            variant="primary"
            size="lg"
            isLoading={isLoading}
            isDisabled={isLoading}
            className="w-full"
          >
            {isLoading ? 'Creating account...' : 'Create account'}
          </Button>

          <div className="text-center">
            <button
              type="button"
              onClick={onBackToLogin}
              className="text-white hover:text-gray-200 text-sm font-medium transition-colors"
            >
              Already have an account? Sign in
            </button>
          </div>
        </form>
      </CardBody>
    </Card>
  );
}