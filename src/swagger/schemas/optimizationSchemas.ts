export const optimizationSchemas = {
  AlternativeDistributor: {
    type: 'object',
    properties: {
      name: {
        type: 'string',
        example: 'ABC Reverse Distributors',
      },
      price: {
        type: 'number',
        example: 0.855,
      },
      difference: {
        type: 'number',
        example: -0.065,
        description: 'Price difference from recommended distributor (negative means cheaper)',
      },
    },
  },
  OptimizationRecommendation: {
    type: 'object',
    properties: {
      ndc: {
        type: 'string',
        example: '00093-2263-01',
      },
      productName: {
        type: 'string',
        example: 'Amoxicillin 500mg Capsule',
      },
      recommendedDistributor: {
        type: 'string',
        example: 'XYZ Pharmaceutical Returns',
      },
      expectedPrice: {
        type: 'number',
        example: 0.92,
        description: 'Best price per unit from recommended distributor',
      },
      alternativeDistributors: {
        type: 'array',
        items: {
          $ref: '#/components/schemas/AlternativeDistributor',
        },
      },
      savings: {
        type: 'number',
        example: 13.75,
        description: 'Potential savings by using recommended distributor',
      },
    },
  },
  OptimizationResponse: {
    type: 'object',
    properties: {
      status: {
        type: 'string',
        example: 'success',
      },
      data: {
        type: 'object',
        properties: {
          recommendations: {
            type: 'array',
            items: {
              $ref: '#/components/schemas/OptimizationRecommendation',
            },
          },
          totalPotentialSavings: {
            type: 'number',
            example: 18.75,
            description: 'Total potential savings across all recommendations',
          },
          generatedAt: {
            type: 'string',
            format: 'date-time',
            example: '2024-02-15T10:00:00Z',
          },
        },
      },
    },
  },
};

