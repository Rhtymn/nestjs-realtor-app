import { Test, TestingModule } from '@nestjs/testing';
import { HomeController } from './home.controller';
import { HomeService } from './home.service';
import { PrismaService } from 'src/prisma/prisma.service';
import { PropertyType } from '@prisma/client';
import { UnauthorizedException } from '@nestjs/common';

const mockUser = {
  id: 53,
  name: 'Laith',
  email: 'laith@hotmail.com',
  phone: '647-123-4567',
};

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

describe('HomeController', () => {
  let controller: HomeController;
  let homeService: HomeService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [HomeController],
      providers: [
        {
          provide: HomeService,
          useValue: {
            getHomes: jest.fn().mockReturnValue([]),
            getRealtorByHomeId: jest.fn().mockReturnValue(mockUser),
            updateHomeById: jest.fn().mockReturnValue(mockHome),
          },
        },
        PrismaService,
      ],
    }).compile();

    controller = module.get<HomeController>(HomeController);
    homeService = module.get<HomeService>(HomeService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('getHomes', () => {
    it('should construct filter object correctly', async () => {
      const mockGetHomes = jest.fn().mockReturnValue([]);

      jest.spyOn(homeService, 'getHomes').mockImplementation(mockGetHomes);
      await controller.getHomes('Toronto', '1000');

      expect(mockGetHomes).toHaveBeenCalledWith({
        city: 'Toronto',
        price: {
          gte: 1000,
        },
      });
    });
  });

  describe('update home', () => {
    const mockUserInfo = {
      name: 'Laith',
      id: 30,
      iat: 1,
      exp: 2,
    };

    const mockUpdateHomeParams = {
      address: '111 Yellow str',
      numberOfBathrooms: 2,
      numberOfBedrooms: 2,
      city: 'Vancouver',
      landSize: 4444,
      price: 3000,
      propertyType: PropertyType.RESIDENTIAL,
    };

    it("should throw unauth error if realtor didn't create home", async () => {
      await expect(
        controller.updateHome(5, mockUpdateHomeParams, mockUserInfo),
      ).rejects.toThrowError(UnauthorizedException);
    });

    it('should update home if realtor id is valid', async () => {
      const mockUpdateHome = jest.fn().mockReturnValue(mockHome);

      jest
        .spyOn(homeService, 'updateHomeById')
        .mockImplementation(mockUpdateHome);

      await controller.updateHome(5, mockUpdateHomeParams, {
        ...mockUserInfo,
        id: 53,
      });

      expect(mockUpdateHome).toBeCalled();
    });
  });
});
