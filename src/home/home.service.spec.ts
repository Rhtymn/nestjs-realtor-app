import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { GetHomesParam, HomeService } from './home.service';
import { PrismaService } from 'src/prisma/prisma.service';
import { PropertyType } from '@prisma/client';

describe('HomeService', () => {
  let service: HomeService;
  let prismaService: PrismaService;
  const mockHomes = [
    {
      id: 1,
      address: '123 Fake St',
      number_of_bedrooms: 3,
      number_of_bathrooms: 2,
      city: 'Springfield',
      listed_date: new Date(),
      price: 100000,
      images: [{ url: 'src1' }],
      land_size: 100,
      propertyType: PropertyType.RESIDENTIAL,
    },
  ];
  const mockHomesResponse = [
    {
      id: 1,
      address: '123 Fake St',
      number_of_bedrooms: 3,
      number_of_bathrooms: 2,
      city: 'Springfield',
      listed_date: new Date(),
      price: 100000,
      image: 'src1',
      land_size: 100,
      propertyType: PropertyType.RESIDENTIAL,
    },
  ];

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        HomeService,
        {
          provide: PrismaService,
          useValue: {
            home: {
              findMany: jest.fn().mockReturnValue(mockHomes),
              findUnique: jest.fn().mockReturnValue(mockHomes[0]),
            },
          },
        },
      ],
    }).compile();

    service = module.get<HomeService>(HomeService);
    prismaService = module.get(PrismaService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getHomes', () => {
    const homeSelect = {
      id: true,
      address: true,
      city: true,
      price: true,
      propertyType: true,
      number_of_bathrooms: true,
      number_of_bedrooms: true,
      images: {
        select: {
          url: true,
        },
        take: 1,
      },
    };
    const filter: GetHomesParam = {
      city: 'Toronto',
      price: {
        lte: 2000,
      },
      propertyType: PropertyType.RESIDENTIAL,
    };

    it('should use the correct filter & select when calling prismaService.home.findMany', async () => {
      // Arrange
      const mockPrismaFindManyHomes = jest.fn().mockReturnValue(mockHomes);

      jest
        .spyOn(prismaService.home, 'findMany')
        .mockImplementation(mockPrismaFindManyHomes);

      // Act
      const homes = await service.getHomes(filter);

      // Assert
      expect(mockPrismaFindManyHomes).toBeCalledWith({
        select: { ...homeSelect },
        where: filter,
      });

      expect(homes).toEqual(mockHomesResponse);
    });

    it('should throw NotFoundException if no homes are found', async () => {
      const mockPrismaFindManyHomes = jest.fn().mockReturnValue(-1);
      jest
        .spyOn(prismaService.home, 'findMany')
        .mockImplementation(mockPrismaFindManyHomes);

      const getHomes = service.getHomes(filter);

      expect(getHomes).rejects.toBeInstanceOf(NotFoundException);
    });
  });

  describe('getHome', () => {
    it('should throw not found exception if no home is found', async () => {
      const mockPrismaFindUniqueHome = jest.fn().mockReturnValue(null);
      jest
        .spyOn(prismaService.home, 'findUnique')
        .mockImplementation(mockPrismaFindUniqueHome);

      const getHome = service.getHome(2);

      expect(getHome).rejects.toBeInstanceOf(NotFoundException);
    });

    it('should response correctly if home is found', async () => {
      const home = await service.getHome(1);

      expect(home).toEqual(mockHomesResponse[0]);
    });
  });
});
