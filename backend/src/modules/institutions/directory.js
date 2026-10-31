import { escapeRegex } from '../../utils/escapeRegex.js';
import { pageQuery, invalid } from './validation.js';

// Public profiles only. A directory association is distinct from university affiliation.
export function institutionDirectory({ models, visibleColleges, decorateColleges }) {
  const { College, CollegeProgram, FranchiseApplication, Taxonomy } = models;
  const collegeFields = Object.fromEntries(['_id','name','category','collegeType','description','about','address','city','district','stateId','country','pincode','logo','banner','facilities','contactInformation','admissionInformation','universityId','verification','createdAt'].map(key => [key, 1]));
  return async (raw = {}) => {
    const query = pageQuery(raw, ['category', 'state', 'district', 'network']);
    if (raw.network && !['all', 'franchise'].includes(raw.network)) throw invalid('Invalid institution filter');
    const visible = await visibleColleges();
    const published = { workflowVersion: 1, status: 'approved', deletedAt: null, listingPublishedAt: { $ne: null }, listingHidden: { $ne: true } };
    const pipeline = [
      { $match: visible }, { $project: collegeFields },
      { $set: { directoryKey: { $concat: ['college:', { $toString: '$_id' }] }, franchiseOnly: false, kitssFranchise: false } },
      { $unionWith: { coll: FranchiseApplication.collection.name, pipeline: [
        { $match: published },
        { $lookup: { from: College.collection.name, let: { listingId: '$collegeListingId' }, pipeline: [{ $match: { ...visible, $expr: { $eq: ['$_id', '$$listingId'] } } }, { $project: collegeFields }], as: 'listing' } },
        { $project: { _id: 1, name: '$institution.name', category: '$institution.type', city: '$location.city', stateId: '$location.stateId', website: '$institution.website', popularCourses: '$programsOffered', createdAt: '$listingPublishedAt', listing: { $arrayElemAt: ['$listing', 0] } } },
        { $replaceWith: { $cond: [ { $ifNull: ['$listing._id', false] }, { $mergeObjects: ['$listing', { directoryKey: { $concat: ['college:', { $toString: '$listing._id' }] }, franchiseOnly: false, kitssFranchise: true }] },
          { _id: '$_id', directoryKey: { $concat: ['franchise:', { $toString: '$_id' }] }, franchiseOnly: true, kitssFranchise: true, name: '$name', category: '$category', city: '$city', stateId: '$stateId', website: '$website', popularCourses: '$popularCourses', createdAt: '$createdAt' } ] } },
      ] } },
      { $sort: { franchiseOnly: 1, directoryKey: 1 } },
      { $group: { _id: '$directoryKey', profile: { $first: '$$ROOT' }, kitssFranchise: { $max: '$kitssFranchise' } } },
      { $replaceWith: { $mergeObjects: ['$profile', { kitssFranchise: '$kitssFranchise' }] } },
      ...(raw.network === 'franchise' ? [{ $match: { kitssFranchise: true } }] : []),
    ];
    const states = await Taxonomy.find({ kind: 'state', status: 'active', deletedAt: null }).select('label').lean();
    const selectedState = states.find(s => s.label === raw.state);
    const filters = {};
    if (raw.state) filters.stateId = selectedState?._id ?? { $in: [] };
    if (raw.district) filters.district = raw.district;
    if (raw.category) filters.category = raw.category;
    if (query.q) {
      const regex = new RegExp(escapeRegex(query.q), 'i');
      const programIds = (await CollegeProgram.find({ status: 'active', deletedAt: null, name: regex }).select('collegeId')).map(p => p.collegeId);
      filters.$or = ['name','city','district','description','popularCourses'].map(key => ({ [key]: regex })).concat({ _id: { $in: programIds } }, { stateId: { $in: states.filter(s => regex.test(s.label)).map(s => s._id) } });
    }
    const [result] = await College.aggregate([...pipeline, { $facet: {
      data: [{ $match: filters }, { $sort: query.sort === 'newest' ? { createdAt: -1, directoryKey: 1 } : { name: 1, directoryKey: 1 } }, { $skip: (query.page - 1) * query.pageSize }, { $limit: query.pageSize }],
      total: [{ $match: filters }, { $count: 'count' }],
      choices: [{ $group: { _id: null, categories: { $addToSet: '$category' }, stateIds: { $addToSet: '$stateId' } } }],
      districts: [...(raw.state ? [{ $match: { stateId: selectedState?._id ?? { $in: [] } } }] : []), { $group: { _id: null, values: { $addToSet: '$district' } } }],
    } }]);
    const decorated = await decorateColleges(result.data.filter(row => !row.franchiseOnly));
    const openIds = new Set((await CollegeProgram.find({ collegeId: { $in: decorated.map(row => row.id) }, status: 'active', deletedAt: null, admissionStatus: 'open' }).select('collegeId')).map(p => String(p.collegeId)));
    const data = result.data.map(row => row.franchiseOnly ? {
      id: String(row._id), directoryKey: row.directoryKey, franchiseOnly: true, kitssFranchise: true,
      name: row.name, category: row.category, city: row.city || '', state: states.find(s => String(s._id) === String(row.stateId))?.label || '',
      website: row.website || '', popularCourses: row.popularCourses || [], admissionsAvailable: false,
    } : { ...decorated.find(item => item.id === String(row._id)), admissionsAvailable: openIds.has(String(row._id)) });
    const choices = result.choices[0] || {}, stateIds = new Set((choices.stateIds || []).map(String));
    const total = result.total[0]?.count || 0;
    return { data, meta: { page: query.page, pageSize: query.pageSize, total, totalPages: Math.max(1, Math.ceil(total / query.pageSize)) }, facets: {
      categories: (choices.categories || []).filter(Boolean).sort(), states: states.filter(s => stateIds.has(String(s._id))).map(s => ({ id: String(s._id), label: s.label })).sort((a,b) => a.label.localeCompare(b.label)),
      districts: (result.districts[0]?.values || []).filter(Boolean).sort(),
    } };
  };
}
