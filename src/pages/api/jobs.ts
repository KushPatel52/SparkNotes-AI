import type { NextApiRequest, NextApiResponse } from 'next';

let jobs: any[] = [];

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'POST') {
    const job = req.body;
    jobs = jobs.filter(j => j.jobId !== job.jobId);
    jobs.push(job);
    res.status(200).json({ success: true });
  } else if (req.method === 'GET') {
    res.status(200).json({ jobs });
  } else {
    res.status(405).end();
  }
} 