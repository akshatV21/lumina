import { BadRequestException } from '@nestjs/common'

export class NoParentError extends BadRequestException {
  constructor() {
    super({
      success: false,
      error: 'NoParentComment',
      message: 'No parent comment was found.',
    })
  }
}

export class NoCommentError extends BadRequestException {
  constructor() {
    super({
      success: false,
      error: 'NoCommentFound',
      message: 'No comment was found.',
    })
  }
}
