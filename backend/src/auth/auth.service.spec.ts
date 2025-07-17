import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { UnauthorizedException, BadRequestException } from '@nestjs/common';
import { AuthService } from './auth.service';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcrypt';

jest.mock('bcrypt');
const mockBcrypt = bcrypt as jest.Mocked<typeof bcrypt>;

describe('AuthService', () => {
  let service: AuthService;
  let prismaService: any;
  let jwtService: any;
  let configService: any;

  const mockUser = {
    id: 'user-1',
    email: 'test@example.com',
    password: 'hashedPassword',
    firstName: 'Test',
    lastName: 'User',
    department: 'Engineering',
    role: 'USER',
    pointsBalance: 100,
    avatarUrl: null,
    isActive: true,
    monthlyPointsAllocation: 1000,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: PrismaService,
          useValue: {
            user: {
              findUnique: jest.fn(),
              create: jest.fn(),
            },
          },
        },
        {
          provide: JwtService,
          useValue: {
            signAsync: jest.fn(),
            verifyAsync: jest.fn(),
          },
        },
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    prismaService = module.get(PrismaService);
    jwtService = module.get(JwtService);
    configService = module.get(ConfigService);
  });

  describe('validateUser', () => {
    it('should return user without password when credentials are valid', async () => {
      prismaService.user.findUnique.mockResolvedValue(mockUser);
      (mockBcrypt.compare as jest.Mock).mockResolvedValue(true);

      const result = await service.validateUser('test@example.com', 'password');

      expect(result).toEqual({
        id: mockUser.id,
        email: mockUser.email,
        firstName: mockUser.firstName,
        lastName: mockUser.lastName,
        department: mockUser.department,
        role: mockUser.role,
        pointsBalance: mockUser.pointsBalance,
        avatarUrl: mockUser.avatarUrl,
        isActive: mockUser.isActive,
        monthlyPointsAllocation: mockUser.monthlyPointsAllocation,
        createdAt: mockUser.createdAt,
        updatedAt: mockUser.updatedAt,
      });
      expect(prismaService.user.findUnique).toHaveBeenCalledWith({
        where: { email: 'test@example.com', isActive: true },
      });
    });

    it('should return null when user is not found', async () => {
      prismaService.user.findUnique.mockResolvedValue(null);

      const result = await service.validateUser('nonexistent@example.com', 'password');

      expect(result).toBeNull();
    });

    it('should return null when password is incorrect', async () => {
      prismaService.user.findUnique.mockResolvedValue(mockUser);
      (mockBcrypt.compare as jest.Mock).mockResolvedValue(false);

      const result = await service.validateUser('test@example.com', 'wrongpassword');

      expect(result).toBeNull();
    });
  });

  describe('login', () => {
    it('should return access token, refresh token and user info', async () => {
      const userWithoutPassword = {
        id: mockUser.id,
        email: mockUser.email,
        firstName: mockUser.firstName,
        lastName: mockUser.lastName,
        department: mockUser.department,
        role: mockUser.role,
        pointsBalance: mockUser.pointsBalance,
        avatarUrl: mockUser.avatarUrl,
      };

      configService.get.mockImplementation((key: string) => {
        switch (key) {
          case 'JWT_SECRET':
            return 'jwt-secret';
          case 'JWT_EXPIRES_IN':
            return '15m';
          case 'JWT_REFRESH_SECRET':
            return 'refresh-secret';
          case 'JWT_REFRESH_EXPIRES_IN':
            return '7d';
          default:
            return null;
        }
      });

      jwtService.signAsync.mockResolvedValueOnce('access-token');
      jwtService.signAsync.mockResolvedValueOnce('refresh-token');

      const result = await service.login(userWithoutPassword);

      expect(result).toEqual({
        access_token: 'access-token',
        refresh_token: 'refresh-token',
        user: userWithoutPassword,
      });
    });
  });

  describe('register', () => {
    const registerData = {
      email: 'newuser@example.com',
      password: 'password123',
      firstName: 'New',
      lastName: 'User',
      department: 'Marketing',
    };

    it('should create new user and return login response', async () => {
      prismaService.user.findUnique.mockResolvedValue(null);
      (mockBcrypt.hash as jest.Mock).mockResolvedValue('hashedPassword');
      prismaService.user.create.mockResolvedValue({
        ...mockUser,
        ...registerData,
        password: 'hashedPassword',
      });

      const loginSpy = jest.spyOn(service, 'login').mockResolvedValue({
        access_token: 'access-token',
        refresh_token: 'refresh-token',
        user: { ...mockUser, ...registerData },
      });

      const result = await service.register(registerData);

      expect(prismaService.user.findUnique).toHaveBeenCalledWith({
        where: { email: registerData.email },
      });
      expect(mockBcrypt.hash).toHaveBeenCalledWith(registerData.password, 10);
      expect(prismaService.user.create).toHaveBeenCalledWith({
        data: {
          ...registerData,
          password: 'hashedPassword',
        },
      });
      expect(loginSpy).toHaveBeenCalled();
      expect(result.access_token).toBe('access-token');
    });

    it('should throw BadRequestException when user already exists', async () => {
      prismaService.user.findUnique.mockResolvedValue(mockUser);

      await expect(service.register(registerData)).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('refreshToken', () => {
    it('should return new tokens when refresh token is valid', async () => {
      const payload = { email: mockUser.email, sub: mockUser.id, role: mockUser.role };
      jwtService.verifyAsync.mockResolvedValue(payload);
      prismaService.user.findUnique.mockResolvedValue(mockUser);

      const loginSpy = jest.spyOn(service, 'login').mockResolvedValue({
        access_token: 'new-access-token',
        refresh_token: 'new-refresh-token',
        user: { ...mockUser },
      });

      const result = await service.refreshToken('valid-refresh-token');

      expect(jwtService.verifyAsync).toHaveBeenCalledWith('valid-refresh-token', {
        secret: undefined,
      });
      expect(loginSpy).toHaveBeenCalled();
      expect(result.access_token).toBe('new-access-token');
    });

    it('should throw UnauthorizedException when refresh token is invalid', async () => {
      jwtService.verifyAsync.mockRejectedValue(new Error('Invalid token'));

      await expect(service.refreshToken('invalid-token')).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('should throw UnauthorizedException when user not found', async () => {
      const payload = { email: mockUser.email, sub: mockUser.id, role: mockUser.role };
      jwtService.verifyAsync.mockResolvedValue(payload);
      prismaService.user.findUnique.mockResolvedValue(null);

      await expect(service.refreshToken('valid-refresh-token')).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });

  describe('getCurrentUser', () => {
    it('should return user information', async () => {
      const expectedUser = {
        id: mockUser.id,
        email: mockUser.email,
        firstName: mockUser.firstName,
        lastName: mockUser.lastName,
        department: mockUser.department,
        role: mockUser.role,
        avatarUrl: mockUser.avatarUrl,
        pointsBalance: mockUser.pointsBalance,
        monthlyPointsAllocation: mockUser.monthlyPointsAllocation,
        createdAt: mockUser.createdAt,
        updatedAt: mockUser.updatedAt,
      };

      prismaService.user.findUnique.mockResolvedValue(expectedUser);

      const result = await service.getCurrentUser(mockUser.id);

      expect(result).toEqual(expectedUser);
      expect(prismaService.user.findUnique).toHaveBeenCalledWith({
        where: { id: mockUser.id, isActive: true },
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          department: true,
          role: true,
          avatarUrl: true,
          pointsBalance: true,
          monthlyPointsAllocation: true,
          createdAt: true,
          updatedAt: true,
        },
      });
    });

    it('should throw UnauthorizedException when user not found', async () => {
      prismaService.user.findUnique.mockResolvedValue(null);

      await expect(service.getCurrentUser('nonexistent-id')).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });
});