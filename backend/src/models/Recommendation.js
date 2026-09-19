import mongoose from 'mongoose';

const recommendationSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    clientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Client',
      required: true,
    },
    crop: {
      type: String,
      required: true,
      trim: true,
    },
    cropName: {
      type: String,
      default: '',
      trim: true,
    },
    fieldArea: {
      type: Number,
      default: 0,
    },
    areaUnit: {
      type: String,
      default: 'acre',
      trim: true,
    },
    doseType: {
      type: String,
      default: 'recommended',
      trim: true,
    },
    customDose: {
      n: { type: Number, default: 0 },
      p: { type: Number, default: 0 },
      k: { type: Number, default: 0 },
    },
    hasSoilTest: {
      type: Boolean,
      default: false,
    },
    isBookmarked: {
      type: Boolean,
      default: false,
    },
    soilTestValues: {
      n: { type: Number, default: 0 },
      p: { type: Number, default: 0 },
      k: { type: Number, default: 0 },
    },
    selectedFertilizers: [
      {
        id: String,
        name: String,
        fertilizerId: String,
        n: Number,
        p: Number,
        k: Number,
        bagWeight: Number,
        price: Number,
        customBagWeight: Number,
        customPrice: Number,
        quantityNeeded: Number,
        bagsNeeded: Number,
        cost: Number,
      },
    ],
    results: {
      fertilizerDetails: [
        {
          id: String,
          name: String,
          fertilizerId: String,
          n: Number,
          p: Number,
          k: Number,
          bagWeight: Number,
          price: Number,
          customBagWeight: Number,
          customPrice: Number,
          quantityNeeded: Number,
          bagsNeeded: Number,
          cost: Number,
        },
      ],
      nutrients: {
        required: {
          n: Number,
          p: Number,
          k: Number,
        },
        provided: {
          n: Number,
          p: Number,
          k: Number,
        },
        percentage: {
          n: Number,
          p: Number,
          k: Number,
        },
        adjustments: {
          n: String,
          p: String,
          k: String,
        },
      },
      totalCost: Number,
      warning: Boolean,
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model('Recommendation', recommendationSchema);
