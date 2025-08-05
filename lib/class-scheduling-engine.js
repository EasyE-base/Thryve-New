/**
 * Advanced Class Scheduling Engine
 * Handles complex scheduling logic, recurring patterns, and availability calculations
 */

export class ClassSchedulingEngine {
  constructor() {
    this.DAYS_OF_WEEK = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']
    this.RECURRENCE_PATTERNS = ['none', 'daily', 'weekly', 'monthly']
  }

  /**
   * Generate class schedule instances from a class template
   */
  generateScheduleInstances(classTemplate, startDate, endDate, recurrencePattern = 'weekly') {
    const instances = []
    const start = new Date(startDate)
    const end = new Date(endDate)
    
    if (recurrencePattern === 'none') {
      // Single instance
      instances.push(this.createClassInstance(classTemplate, start))
    } else if (recurrencePattern === 'weekly') {
      // Weekly recurrence
      let currentDate = new Date(start)
      while (currentDate <= end) {
        instances.push(this.createClassInstance(classTemplate, new Date(currentDate)))
        currentDate.setDate(currentDate.getDate() + 7)
      }
    } else if (recurrencePattern === 'daily') {
      // Daily recurrence (for intensive programs)
      let currentDate = new Date(start)
      while (currentDate <= end) {
        if (this.isValidClassDay(currentDate, classTemplate.scheduleDays)) {
          instances.push(this.createClassInstance(classTemplate, new Date(currentDate)))
        }
        currentDate.setDate(currentDate.getDate() + 1)
      }
    }

    return instances
  }

  /**
   * Create a single class instance from template
   */
  createClassInstance(classTemplate, date) {
    const startTime = new Date(date)
    const [hours, minutes] = classTemplate.startTime.split(':')
    startTime.setHours(parseInt(hours), parseInt(minutes), 0, 0)
    
    const endTime = new Date(startTime)
    endTime.setMinutes(endTime.getMinutes() + classTemplate.duration)

    return {
      id: `${classTemplate.id}_${date.toISOString().split('T')[0]}_${classTemplate.startTime}`,
      classId: classTemplate.id,
      className: classTemplate.name,
      description: classTemplate.description,
      instructorId: classTemplate.defaultInstructorId || null,
      instructorName: classTemplate.defaultInstructorName || 'TBD',
      startTime: startTime.toISOString(),
      endTime: endTime.toISOString(),
      duration: classTemplate.duration,
      capacity: classTemplate.capacity || 20,
      bookedCount: 0,
      waitlistCount: 0,
      availableSpots: classTemplate.capacity || 20,
      price: classTemplate.price || 0,
      category: classTemplate.category || 'fitness',
      level: classTemplate.level || 'all-levels',
      requirements: classTemplate.requirements || '',
      status: 'scheduled',
      studioId: classTemplate.studioId,
      isRecurring: classTemplate.isRecurring || false,
      recurrencePattern: classTemplate.recurrencePattern || 'weekly',
      tags: classTemplate.tags || [],
      memberPlusOnly: classTemplate.memberPlusOnly || false,
      xPassEligible: classTemplate.xPassEligible || true,
      createdAt: new Date(),
      updatedAt: new Date()
    }
  }

  /**
   * Check if a date is valid for class scheduling
   */
  isValidClassDay(date, scheduleDays = []) {
    if (!scheduleDays || scheduleDays.length === 0) return true
    
    const dayName = this.DAYS_OF_WEEK[date.getDay()]
    return scheduleDays.includes(dayName)
  }

  /**
   * Calculate real-time availability for class instances
   */
  calculateAvailability(classInstances, bookings = [], waitlists = []) {
    return classInstances.map(instance => {
      const classBookings = bookings.filter(b => 
        b.classInstanceId === instance.id && b.status === 'confirmed'
      )
      const classWaitlist = waitlists.filter(w => 
        w.classInstanceId === instance.id && w.status === 'active'
      )

      const bookedCount = classBookings.length
      const waitlistCount = classWaitlist.length
      const availableSpots = Math.max(0, instance.capacity - bookedCount)
      const isAvailable = availableSpots > 0
      const isFull = availableSpots === 0
      const hasWaitlist = waitlistCount > 0

      return {
        ...instance,
        bookedCount,
        waitlistCount,
        availableSpots,
        isAvailable,
        isFull,
        hasWaitlist,
        bookings: classBookings,
        waitlist: classWaitlist
      }
    })
  }

  /**
   * Handle instructor assignment and conflict detection
   */
  assignInstructor(classInstance, instructorId, instructorAvailability = []) {
    // Check for instructor conflicts
    const classStart = new Date(classInstance.startTime)
    const classEnd = new Date(classInstance.endTime)

    const hasConflict = instructorAvailability.some(availability => {
      const availStart = new Date(availability.startTime)
      const availEnd = new Date(availability.endTime)
      
      return (
        (classStart >= availStart && classStart < availEnd) ||
        (classEnd > availStart && classEnd <= availEnd) ||
        (classStart <= availStart && classEnd >= availEnd)
      )
    })

    if (hasConflict) {
      return {
        success: false,
        error: 'Instructor has a scheduling conflict',
        conflicts: instructorAvailability.filter(a => {
          const availStart = new Date(a.startTime)
          const availEnd = new Date(a.endTime)
          return (classStart < availEnd && classEnd > availStart)
        })
      }
    }

    return {
      success: true,
      updatedInstance: {
        ...classInstance,
        instructorId,
        updatedAt: new Date()
      }
    }
  }

  /**
   * Process booking request with availability check
   */
  processBookingRequest(classInstance, userId, userMembership = null) {
    const now = new Date()
    const classStart = new Date(classInstance.startTime)
    
    // Check if booking window is open
    if (classStart <= now) {
      return {
        success: false,
        error: 'Cannot book classes that have already started',
        code: 'CLASS_STARTED'
      }
    }

    // Check capacity
    if (classInstance.availableSpots <= 0) {
      return {
        success: false,
        error: 'Class is full - join waitlist instead',
        code: 'CLASS_FULL',
        suggestion: 'waitlist'
      }
    }

    // Check membership restrictions
    if (classInstance.memberPlusOnly && (!userMembership || userMembership.type !== 'member_plus')) {
      return {
        success: false,
        error: 'This class is only available to Member+ subscribers',
        code: 'MEMBER_PLUS_REQUIRED'
      }
    }

    // Check user's booking limits (if applicable)
    // This would be expanded based on business rules

    return {
      success: true,
      booking: {
        id: `booking_${Date.now()}_${userId}`,
        classInstanceId: classInstance.id,
        classId: classInstance.classId,
        className: classInstance.className,
        userId,
        startTime: classInstance.startTime,
        endTime: classInstance.endTime,
        price: this.calculateBookingPrice(classInstance, userMembership),
        status: 'confirmed',
        paymentStatus: 'pending',
        bookingType: this.determineBookingType(userMembership),
        createdAt: new Date(),
        updatedAt: new Date()
      }
    }
  }

  /**
   * Calculate booking price based on membership and class
   */
  calculateBookingPrice(classInstance, userMembership) {
    if (!userMembership) {
      return classInstance.price // Drop-in price
    }

    switch (userMembership.type) {
      case 'unlimited':
        return 0 // Covered by membership
      case 'class_pack':
        return 0 // Deduct from pack
      case 'member_plus':
        return 0 // Covered by membership
      default:
        return classInstance.price
    }
  }

  /**
   * Determine booking type based on membership
   */
  determineBookingType(userMembership) {
    if (!userMembership) return 'drop_in'
    
    switch (userMembership.type) {
      case 'unlimited':
        return 'unlimited_membership'
      case 'class_pack':
        return 'class_pack'
      case 'member_plus':
        return 'member_plus'
      default:
        return 'drop_in'
    }
  }

  /**
   * Process waitlist addition
   */
  addToWaitlist(classInstance, userId, userPreferences = {}) {
    return {
      id: `waitlist_${Date.now()}_${userId}`,
      classInstanceId: classInstance.id,
      classId: classInstance.classId,
      className: classInstance.className,
      userId,
      position: classInstance.waitlistCount + 1,
      startTime: classInstance.startTime,
      endTime: classInstance.endTime,
      status: 'active',
      autoBook: userPreferences.autoBook || false,
      notificationPreferences: userPreferences.notifications || { email: true, sms: false },
      createdAt: new Date(),
      updatedAt: new Date()
    }
  }

  /**
   * Process waitlist promotion when spot becomes available
   */
  promoteFromWaitlist(waitlistEntries, availableSpots = 1) {
    const promotions = []
    const sortedWaitlist = waitlistEntries
      .filter(entry => entry.status === 'active')
      .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt))

    for (let i = 0; i < Math.min(availableSpots, sortedWaitlist.length); i++) {
      const waitlistEntry = sortedWaitlist[i]
      
      promotions.push({
        waitlistId: waitlistEntry.id,
        userId: waitlistEntry.userId,
        classInstanceId: waitlistEntry.classInstanceId,
        promotedAt: new Date(),
        autoBook: waitlistEntry.autoBook,
        booking: waitlistEntry.autoBook ? {
          id: `booking_promoted_${Date.now()}_${waitlistEntry.userId}`,
          classInstanceId: waitlistEntry.classInstanceId,
          userId: waitlistEntry.userId,
          status: 'confirmed',
          bookingType: 'waitlist_promotion',
          createdAt: new Date()
        } : null
      })
    }

    return promotions
  }

  /**
   * Generate availability calendar for studio
   */
  generateAvailabilityCalendar(classInstances, startDate, endDate) {
    const start = new Date(startDate)
    const end = new Date(endDate)
    const calendar = {}

    // Group classes by date
    classInstances.forEach(instance => {
      const date = new Date(instance.startTime).toISOString().split('T')[0]
      
      if (!calendar[date]) {
        calendar[date] = {
          date,
          classes: [],
          totalClasses: 0,
          totalCapacity: 0,
          totalBooked: 0,
          availabilityRate: 0
        }
      }

      calendar[date].classes.push(instance)
      calendar[date].totalClasses++
      calendar[date].totalCapacity += instance.capacity
      calendar[date].totalBooked += instance.bookedCount
    })

    // Calculate availability rates
    Object.values(calendar).forEach(day => {
      day.availabilityRate = day.totalCapacity > 0 
        ? ((day.totalCapacity - day.totalBooked) / day.totalCapacity) * 100 
        : 0
    })

    return calendar
  }

  /**
   * Search and filter classes
   */
  searchClasses(classInstances, filters = {}) {
    let results = [...classInstances]

    // Filter by date range
    if (filters.startDate && filters.endDate) {
      const start = new Date(filters.startDate)
      const end = new Date(filters.endDate)
      results = results.filter(instance => {
        const instanceDate = new Date(instance.startTime)
        return instanceDate >= start && instanceDate <= end
      })
    }

    // Filter by category
    if (filters.category && filters.category !== 'all') {
      results = results.filter(instance => instance.category === filters.category)
    }

    // Filter by level
    if (filters.level && filters.level !== 'all') {
      results = results.filter(instance => instance.level === filters.level)
    }

    // Filter by instructor
    if (filters.instructorId) {
      results = results.filter(instance => instance.instructorId === filters.instructorId)
    }

    // Filter by availability
    if (filters.availableOnly) {
      results = results.filter(instance => instance.availableSpots > 0)
    }

    // Filter by time of day
    if (filters.timeOfDay) {
      results = results.filter(instance => {
        const hour = new Date(instance.startTime).getHours()
        switch (filters.timeOfDay) {
          case 'morning':
            return hour >= 6 && hour < 12
          case 'afternoon':
            return hour >= 12 && hour < 17
          case 'evening':
            return hour >= 17 && hour < 21
          default:
            return true
        }
      })
    }

    // Filter by tags
    if (filters.tags && filters.tags.length > 0) {
      results = results.filter(instance => 
        filters.tags.some(tag => instance.tags.includes(tag))
      )
    }

    // Sort results
    if (filters.sortBy) {
      results.sort((a, b) => {
        switch (filters.sortBy) {
          case 'date':
            return new Date(a.startTime) - new Date(b.startTime)
          case 'popularity':
            return b.bookedCount - a.bookedCount
          case 'availability':
            return b.availableSpots - a.availableSpots
          case 'price':
            return a.price - b.price
          default:
            return 0
        }
      })
    }

    return results
  }

  /**
   * Validate class scheduling rules
   */
  validateScheduling(classData, existingSchedules = []) {
    const errors = []
    const warnings = []

    // Check required fields
    if (!classData.name || classData.name.trim() === '') {
      errors.push('Class name is required')
    }

    if (!classData.startTime) {
      errors.push('Start time is required')
    }

    if (!classData.duration || classData.duration <= 0) {
      errors.push('Valid duration is required')
    }

    if (!classData.capacity || classData.capacity <= 0) {
      errors.push('Valid capacity is required')
    }

    // Check for scheduling conflicts
    if (classData.instructorId && existingSchedules.length > 0) {
      const proposedStart = new Date(classData.startTime)
      const proposedEnd = new Date(proposedStart.getTime() + classData.duration * 60000)

      const conflicts = existingSchedules.filter(schedule => {
        if (schedule.instructorId !== classData.instructorId) return false
        
        const existingStart = new Date(schedule.startTime)
        const existingEnd = new Date(schedule.endTime)
        
        return (proposedStart < existingEnd && proposedEnd > existingStart)
      })

      if (conflicts.length > 0) {
        errors.push(`Instructor has ${conflicts.length} scheduling conflict(s)`)
      }
    }

    // Business rule warnings
    if (classData.capacity && classData.capacity > 50) {
      warnings.push('Large class capacity - ensure adequate space and equipment')
    }

    if (classData.duration && classData.duration > 120) {
      warnings.push('Long class duration - consider member engagement and fatigue')
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    }
  }
}

export default new ClassSchedulingEngine()