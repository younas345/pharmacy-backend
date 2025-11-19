export const returnReportSchemas = {
  ReturnReportResponse: {
    type: 'object',
    properties: {
      status: {
        type: 'string',
        example: 'success',
      },
      message: {
        type: 'string',
        example: 'Return report processed successfully',
      },
      data: {
        type: 'object',
        properties: {
          distributor: {
            type: 'string',
            example: 'ABC Distributors',
            nullable: true,
          },
          pharmacy: {
            type: 'string',
            example: 'City Pharmacy',
            nullable: true,
          },
          reportDate: {
            type: 'string',
            format: 'date',
            example: '2024-01-15',
            nullable: true,
          },
          returnNumber: {
            type: 'string',
            example: 'RET-2024-001',
            nullable: true,
          },
          items: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                itemName: {
                  type: 'string',
                  nullable: true,
                },
                itemCode: {
                  type: 'string',
                  nullable: true,
                },
                quantity: {
                  type: 'number',
                  nullable: true,
                },
                unitPrice: {
                  type: 'number',
                  nullable: true,
                },
                totalPrice: {
                  type: 'number',
                  nullable: true,
                },
                expiryDate: {
                  type: 'string',
                  format: 'date',
                  nullable: true,
                },
                reason: {
                  type: 'string',
                  nullable: true,
                },
                batchNumber: {
                  type: 'string',
                  nullable: true,
                },
              },
            },
            nullable: true,
          },
          totalAmount: {
            type: 'number',
            nullable: true,
          },
          totalItems: {
            type: 'number',
            nullable: true,
          },
          notes: {
            type: 'string',
            nullable: true,
          },
        },
      },
    },
  },
};

