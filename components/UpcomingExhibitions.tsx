import React, { useState, useEffect } from 'react';
import { Calendar, MapPin, Clock, Users, Mic, ArrowRight } from 'lucide-react';

interface Exhibition {
  id: string;
  title: string;
  description: string;
  startDate: string;
  endDate: string;
  galleryHours: Array<{
    day: number;
    open: string;
    close: string;
  }>;
  gallerist: {
    name: string;
  };
  _count: {
    queue: number;
    psaFiles: number;
  };
}

const UpcomingExhibitions = () => {
  const [exhibitions, setExhibitions] = useState<Exhibition[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUpcomingExhibitions();
  }, []);

  const fetchUpcomingExhibitions = async () => {
    try {
      // This would call your exhibitions API with a filter for upcoming events
      const response = await fetch('/api/exhibitions?upcoming=true&limit=3');
      const data = await response.json();
      setExhibitions(data.exhibitions || []);
    } catch (error) {
      console.error('Failed to fetch upcoming exhibitions:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatDateRange = (start: string, end: string) => {
    const startDate = new Date(start);
    const endDate = new Date(end);
    
    if (startDate.getFullYear() === endDate.getFullYear() && 
        startDate.getMonth() === endDate.getMonth()) {
      return `${startDate.toLocaleDateString('en-US', { month: 'long' })} ${startDate.getDate()}–${endDate.getDate()}, ${startDate.getFullYear()}`;
    }
    
    return `${startDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} – ${endDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`;
  };

  const getGalleryHoursText = (galleryHours: Exhibition['galleryHours']) => {
    const weekdays = galleryHours.filter(h => h.day >= 1 && h.day <= 5);
    const weekend = galleryHours.filter(h => h.day === 0 || h.day === 6);
    
    if (weekdays.length > 0) {
      const typical = weekdays[0];
      return `Weekdays ${typical.open}–${typical.close}${weekend.length > 0 ? ', Weekend hours vary' : ''}`;
    }
    
    return 'See gallery for hours';
  };

  if (loading) {
    return (
      <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-2xl p-8">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded-lg w-3/4 mb-6"></div>
          <div className="space-y-4">
            {[1, 2].map(i => (
              <div key={i} className="h-32 bg-gray-200 rounded-lg"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (exhibitions.length === 0) {
    return (
      <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-2xl p-8 text-center">
        <Mic className="mx-auto h-16 w-16 text-indigo-400 mb-4" />
        <h3 className="text-2xl font-bold text-gray-900 mb-2">No Upcoming Exhibitions</h3>
        <p className="text-gray-600">New exhibitions are being planned. Check back soon!</p>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-2xl p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-3xl font-bold text-gray-900 mb-2">Upcoming Exhibitions</h2>
          <p className="text-gray-600">Experience the power of community voices reading names</p>
        </div>
        <div className="hidden md:flex items-center space-x-2 text-indigo-600">
          <Mic className="h-6 w-6" />
          <span className="font-medium">Live Audio Installations</span>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {exhibitions.map((exhibition) => (
          <div key={exhibition.id} className="bg-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden group">
            <div className="p-6">
              <div className="flex items-start justify-between mb-4">
                <h3 className="text-xl font-bold text-gray-900 group-hover:text-indigo-600 transition-colors">
                  {exhibition.title}
                </h3>
                <div className="bg-indigo-100 text-indigo-800 px-3 py-1 rounded-full text-sm font-medium">
                  Upcoming
                </div>
              </div>

              <p className="text-gray-600 mb-6 line-clamp-3">
                {exhibition.description}
              </p>

              <div className="space-y-3 mb-6">
                <div className="flex items-center text-gray-700">
                  <Calendar className="h-5 w-5 text-indigo-500 mr-3 flex-shrink-0" />
                  <span className="text-sm font-medium">
                    {formatDateRange(exhibition.startDate, exhibition.endDate)}
                  </span>
                </div>

                <div className="flex items-center text-gray-700">
                  <Clock className="h-5 w-5 text-indigo-500 mr-3 flex-shrink-0" />
                  <span className="text-sm">
                    {getGalleryHoursText(exhibition.galleryHours)}
                  </span>
                </div>

                <div className="flex items-center text-gray-700">
                  <Users className="h-5 w-5 text-indigo-500 mr-3 flex-shrink-0" />
                  <span className="text-sm">
                    Curated by {exhibition.gallerist.name}
                  </span>
                </div>

                {exhibition._count.queue > 0 && (
                  <div className="flex items-center text-gray-700">
                    <Mic className="h-5 w-5 text-indigo-500 mr-3 flex-shrink-0" />
                    <span className="text-sm">
                      {exhibition._count.queue.toLocaleString()} recordings queued
                    </span>
                  </div>
                )}
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                <div className="text-sm text-gray-500">
                  Opening {formatDate(exhibition.startDate)}
                </div>
                <button className="inline-flex items-center text-indigo-600 hover:text-indigo-800 font-medium text-sm group-hover:translate-x-1 transition-transform">
                  Learn More
                  <ArrowRight className="ml-1 h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-8 text-center">
        <div className="bg-white rounded-lg p-6 shadow-sm">
          <h4 className="text-lg font-semibold text-gray-900 mb-2">Want to Contribute?</h4>
          <p className="text-gray-600 mb-4">
            Join our community of voices. Your recording could be part of the next exhibition.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <button className="bg-indigo-600 text-white px-6 py-3 rounded-lg hover:bg-indigo-700 transition-colors font-medium">
              Record Live
            </button>
            <button className="border border-indigo-600 text-indigo-600 px-6 py-3 rounded-lg hover:bg-indigo-50 transition-colors font-medium">
              Upload Recording
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UpcomingExhibitions;