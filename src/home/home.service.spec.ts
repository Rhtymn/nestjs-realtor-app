import { Test, TestingModule } from '@nestjs/testing';
import { HomeService, homeSelect } from './home.service';
import { PrismaService } from 'src/prisma/prisma.service';
import { PropertyType } from '@prisma/client';
import { NotFoundException } from '@nestjs/common';

const mockGetHomes = [
  {
    id: 1,
    address: 'Sidomulyo',
    city: 'Sragen',
    price: 1500,
    propertyType: PropertyType.RESIDENTIAL,
    image: 'img1',
    number_of_bedrooms: 2,
    number_of_bathrooms: 1,
    images: [
      {
        url: 'img1',
      },
    ],
  },
  {
    id: 2,
    address: 'Widoro',
    city: 'Ngawi',
    price: 2000,
    propertyType: PropertyType.CONDO,
    image: 'img4',
    number_of_bedrooms: 3,
    number_of_bathrooms: 1,
    images: [
      {
        url: 'img4',
      },
    ],
  },
];

const mockHome = {
  id: 1,
  address: 'Sidomulyo',
  city: 'Sragen',
  price: 1500,
  propertyType: PropertyType.RESIDENTIAL,
  image: 'img1',
  number_of_bedrooms: 2,
  number_of_bathrooms: 1,
  images: [
    {
      url: 'img1',
    },
  ],
};

const mockImages = [
  { id: 1, url: 'img1' },
  { id: 2, url: 'img2' },
];

describe('HomeService', () => {
  let service: HomeService;
  let prismaService: PrismaService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        HomeService,
        {
          provide: PrismaService,
          useValue: {
            home: {
              findMany: jest.fn().mockReturnValue(mockGetHomes),
              create: jest.fn().mockReturnValue(mockHome),
            },
            image: {
              createMany: jest.fn().mockReturnValue(mockImages),
            },
          },
        },
      ],
    }).compile();

    service = module.get<HomeService>(HomeService);
    prismaService = module.get<PrismaService>(PrismaService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getHomes', () => {
    const filters = {
      city: 'Toronto',
      price: {
        gte: 1000,
        lte: 2000,
      },
      propertyType: PropertyType.RESIDENTIAL,
    };

    it('"should call prisma home.findMany with correct params', async () => {
      const mockPrismaFindManyHomes = jest.fn().mockReturnValue(mockGetHomes);

      jest
        .spyOn(prismaService.home, 'findMany')
        .mockImplementation(mockPrismaFindManyHomes);

      await service.getHomes(filters);

      expect(mockPrismaFindManyHomes).toBeCalledWith({
        select: {
          ...homeSelect,
          images: {
            select: {
              url: true,
            },
            take: 1,
          },
        },
        where: filters,
      });
    });

    it("should throw not found exception if homes doesn't exist", async () => {
      const mockPrismaFindManyHomes = jest.fn().mockReturnValue([]);

      jest
        .spyOn(prismaService.home, 'findMany')
        .mockImplementation(mockPrismaFindManyHomes);

      await expect(service.getHomes(filters)).rejects.toThrowError(
        NotFoundException,
      );
    });
  });

  describe('createHome', () => {
    const mockCreateHomeParams = {
      address: '111 Yellow str',
      numberOfBathrooms: 2,
      numberOfBedrooms: 2,
      city: 'Vancouver',
      landSize: 4444,
      price: 3000,
      propertyType: PropertyType.RESIDENTIAL,
      images: [
        {
          url: 'src1',
        },
      ],
    };

    it('should call prisma home.create with the correct payload', async () => {
      const mockCreateHome = jest.fn().mockReturnValue(mockHome);

      jest
        .spyOn(prismaService.home, 'create')
        .mockImplementation(mockCreateHome);

      await service.createHome(mockCreateHomeParams, 5);

      expect(mockCreateHome).toBeCalledWith({
        data: {
          address: '111 Yellow str',
          number_of_bathrooms: 2,
          number_of_bedrooms: 2,
          city: 'Vancouver',
          land_size: 4444,
          propertyType: PropertyType.RESIDENTIAL,
          price: 3000,
          realtor_id: 5,
        },
      });
    });

    it('should call prisma image.createMany with the correct payload', async () => {
      const mockCreateManyImage = jest.fn().mockReturnValue(mockImages);

      jest
        .spyOn(prismaService.image, 'createMany')
        .mockImplementation(mockCreateManyImage);

      await service.createHome(mockCreateHomeParams, 5);

      expect(mockCreateManyImage).toBeCalledWith({
        data: [{ url: 'src1', home_id: 1 }],
      });
    });
  });
});
