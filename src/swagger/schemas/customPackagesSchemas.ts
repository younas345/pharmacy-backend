export const customPackagesSchemas = {
  CustomPackageItem: {
    type: 'object',
    required: ['ndc', 'quantity'],
    properties: {
      ndc: {
        type: 'string',
        example: '45963-0142-05',
        description: 'NDC code of the product',
      },
      productName: {
        type: 'string',
        example: 'Fluoxetine',
        description: 'Name of the product (camelCase)',
      },
      product_name: {
        type: 'string',
        example: 'Fluoxetine',
        description: 'Name of the product (snake_case - alternative format)',
      },
      quantity: {
        type: 'number',
        example: 50,
        description: 'Quantity of the product',
        minimum: 1,
      },
      pricePerUnit: {
        type: 'number',
        example: 2.50,
        description: 'Price per unit (camelCase)',
        minimum: 0,
      },
      price_per_unit: {
        type: 'number',
        example: 2.50,
        description: 'Price per unit (snake_case - alternative format)',
        minimum: 0,
      },
      totalValue: {
        type: 'number',
        example: 125.00,
        description: 'Total value (quantity × pricePerUnit) (camelCase)',
        minimum: 0,
      },
      total_value: {
        type: 'number',
        example: 125.00,
        description: 'Total value (quantity × pricePerUnit) (snake_case - alternative format)',
        minimum: 0,
      },
    },
    description: 'Package item. Accepts both camelCase (productName, pricePerUnit, totalValue) and snake_case (product_name, price_per_unit, total_value) formats. At least one format for product name, price, and total value must be provided.',
  },
  CreateCustomPackageRequest: {
    type: 'object',
    required: ['distributorName', 'items'],
    properties: {
      distributorName: {
        type: 'string',
        example: 'XYZ Pharmaceutical Returns',
        description: 'Name of the distributor',
      },
      distributorId: {
        type: 'string',
        format: 'uuid',
        example: '123e4567-e89b-12d3-a456-426614174000',
        nullable: true,
        description: 'ID of the distributor (optional)',
      },
      items: {
        type: 'array',
        description: 'Array of items to include in the package',
        minItems: 1,
        items: {
          $ref: '#/components/schemas/CustomPackageItem',
        },
      },
      notes: {
        type: 'string',
        example: 'Priority shipment',
        nullable: true,
        description: 'Optional notes for the package',
      },
    },
  },
  DistributorContact: {
    type: 'object',
    properties: {
      email: {
        type: 'string',
        example: 'support@xyzpharma.com',
        nullable: true,
        description: 'Contact email for the distributor',
      },
      phone: {
        type: 'string',
        example: '(555) 987-6543',
        nullable: true,
        description: 'Contact phone for the distributor',
      },
      location: {
        type: 'string',
        example: '456 Oak Ave, Chicago, IL, 60601, USA',
        nullable: true,
        description: 'Location/address of the distributor',
      },
    },
    nullable: true,
  },
  CustomPackage: {
    type: 'object',
    properties: {
      id: {
        type: 'string',
        format: 'uuid',
        example: '123e4567-e89b-12d3-a456-426614174000',
      },
      packageNumber: {
        type: 'string',
        example: 'PKG-1704123456789-1234',
        description: 'Unique package number',
      },
      pharmacyId: {
        type: 'string',
        format: 'uuid',
        example: '123e4567-e89b-12d3-a456-426614174000',
      },
      distributorName: {
        type: 'string',
        example: 'XYZ Pharmaceutical Returns',
      },
      distributorId: {
        type: 'string',
        format: 'uuid',
        example: '123e4567-e89b-12d3-a456-426614174000',
        nullable: true,
      },
      distributorContact: {
        $ref: '#/components/schemas/DistributorContact',
      },
      items: {
        type: 'array',
        description: 'Items in the package',
        items: {
          $ref: '#/components/schemas/CustomPackageItem',
        },
      },
      totalItems: {
        type: 'number',
        example: 50,
        description: 'Total number of items (sum of all quantities)',
      },
      totalEstimatedValue: {
        type: 'number',
        example: 125.00,
        description: 'Total estimated value of the package',
      },
      notes: {
        type: 'string',
        example: 'Priority shipment',
        nullable: true,
      },
      status: {
        type: 'string',
        enum: ['draft', 'ready_to_ship', 'in_transit', 'received', 'processed', 'completed', 'cancelled'],
        example: 'draft',
        description: 'Status of the package',
      },
      createdAt: {
        type: 'string',
        format: 'date-time',
        example: '2024-01-15T10:30:00.000Z',
      },
      updatedAt: {
        type: 'string',
        format: 'date-time',
        example: '2024-01-15T10:30:00.000Z',
      },
    },
  },
  CustomPackagesListResponse: {
    type: 'object',
    properties: {
      packages: {
        type: 'array',
        description: 'Array of custom packages',
        items: {
          $ref: '#/components/schemas/CustomPackage',
        },
      },
      total: {
        type: 'number',
        example: 10,
        description: 'Total number of packages',
      },
    },
  },
  CreateCustomPackageResponse: {
    type: 'object',
    properties: {
      status: {
        type: 'string',
        example: 'success',
      },
      data: {
        $ref: '#/components/schemas/CustomPackage',
      },
    },
  },
  GetCustomPackagesResponse: {
    type: 'object',
    properties: {
      status: {
        type: 'string',
        example: 'success',
      },
      data: {
        $ref: '#/components/schemas/CustomPackagesListResponse',
      },
    },
  },
  GetCustomPackageResponse: {
    type: 'object',
    properties: {
      status: {
        type: 'string',
        example: 'success',
      },
      data: {
        $ref: '#/components/schemas/CustomPackage',
      },
    },
  },
  DeleteCustomPackageResponse: {
    type: 'object',
    properties: {
      status: {
        type: 'string',
        example: 'success',
      },
      message: {
        type: 'string',
        example: 'Package deleted successfully',
      },
    },
  },
};

